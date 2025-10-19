const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const {auth ,adminAuth} = require('../middleware/auth');

// ===== ADMIN ROUTES =====
// GET all users (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET user statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET specific user (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('readingList.book', 'title author coverImage category')
      .populate('downloadedBooks.book', 'title author coverImage category')
      .populate('readingStats.favorites', 'title author coverImage');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE user (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    const allowedUpdates = ['name', 'role', 'isActive'];
    
    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE user (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== USER PROFILE ROUTES (Authenticated Users) =====

// GET user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('readingList.book', 'title author coverImage pages category')
      .populate('downloadedBooks.book', 'title author coverImage')
      .populate('readingStats.favorites', 'title author coverImage')
      .populate('readingStats.currentlyReading.book', 'title author coverImage pages');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const allowedUpdates = ['name', 'preferences'];
    
    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== READING LIST ENDPOINTS =====

// GET reading list
router.get('/reading-list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('readingList.book', 'title author coverImage description pages category publicationYear isbn accessLevel');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, readingList: user.readingList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD to reading list
router.post('/reading-list', auth, async (req, res) => {
  try {
    const { bookId, notes } = req.body;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    const user = await User.findById(req.user.id);
    await user.addToReadingList(bookId, notes);
    
    const updatedUser = await User.findById(req.user.id)
      .populate('readingList.book', 'title author coverImage description pages category');
    
    res.json({ 
      success: true, 
      message: 'Book added to reading list',
      readingList: updatedUser.readingList 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REMOVE from reading list
router.delete('/reading-list/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const user = await User.findById(req.user.id);
    await user.removeFromReadingList(bookId);
    
    const updatedUser = await User.findById(req.user.id)
      .populate('readingList.book', 'title author coverImage description pages category');
    
    res.json({ 
      success: true, 
      message: 'Book removed from reading list',
      readingList: updatedUser.readingList 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE reading list notes
router.put('/reading-list/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { notes } = req.body;
    
    const user = await User.findById(req.user.id);
    const readingItem = user.readingList.find(item => item.book.toString() === bookId);
    
    if (!readingItem) {
      return res.status(404).json({ success: false, message: 'Book not found in reading list' });
    }
    
    readingItem.notes = notes || '';
    await user.save();
    
    const updatedUser = await User.findById(req.user.id)
      .populate('readingList.book', 'title author coverImage description pages category');
    
    res.json({ 
      success: true, 
      message: 'Reading list updated',
      readingList: updatedUser.readingList 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== FAVORITES ENDPOINTS =====

// GET favorites
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('readingStats.favorites', 'title author coverImage description pages category accessLevel');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, favorites: user.readingStats.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD to favorites
router.post('/favorites', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    const user = await User.findById(req.user.id);
    await user.addToFavorites(bookId);
    
    res.json({ 
      success: true, 
      message: 'Book added to favorites'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REMOVE from favorites
router.delete('/favorites/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const user = await User.findById(req.user.id);
    await user.removeFromFavorites(bookId);
    
    res.json({ 
      success: true, 
      message: 'Book removed from favorites'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DOWNLOAD TRACKING =====

// Track book download
router.post('/track-download', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Check access rights for premium books
    if (book.accessLevel === 'premium') {
      const user = await User.findById(req.user.id);
      if (!user.hasPremiumAccess()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Premium subscription required to download this book' 
        });
      }
    }
    
    // Track download in user's record
    const user = await User.findById(req.user.id);
    await user.trackDownload(bookId);
    
    // Increment book's download count
    await Book.findByIdAndUpdate(bookId, { $inc: { downloadCount: 1 } });
    
    res.json({ 
      success: true, 
      message: 'Download tracked successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET download history
router.get('/downloads', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('downloadedBooks.book', 'title author coverImage category accessLevel downloadCount');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, downloads: user.downloadedBooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== USER STATISTICS =====
router.get('/stats/personal', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('readingStats.currentlyReading.book', 'title author coverImage pages')
      .populate('readingStats.favorites', 'title author coverImage')
      .populate('readingList.book', 'title author')
      .populate('downloadedBooks.book', 'title author');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const stats = {
      totalBooksRead: user.readingStats.totalBooksRead,
      totalReadingTime: user.readingStats.totalReadingTime,
      currentlyReading: user.readingStats.currentlyReading,
      favorites: user.readingStats.favorites,
      readingListCount: user.readingList.length,
      downloadedBooksCount: user.downloadedBooks.length,
      totalDownloads: user.downloadedBooks.reduce((sum, item) => sum + item.downloadCount, 0)
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE reading progress
router.put('/reading-progress', auth, async (req, res) => {
  try {
    const { bookId, currentPage } = req.body;
    
    const user = await User.findById(req.user.id);
    let currentlyReading = user.readingStats.currentlyReading.find(
      item => item.book.toString() === bookId
    );
    
    if (currentlyReading) {
      currentlyReading.lastPage = currentPage;
    } else {
      user.readingStats.currentlyReading.push({
        book: bookId,
        lastPage: currentPage
      });
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Reading progress updated'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// MARK book as completed
router.post('/reading-complete', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Remove from currently reading
    user.readingStats.currentlyReading = user.readingStats.currentlyReading.filter(
      item => item.book.toString() !== bookId
    );
    
    // Increment books read count
    user.readingStats.totalBooksRead += 1;
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Book marked as completed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PASSWORD MANAGEMENT =====

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;




















// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const Book = require('../models/Book');
// const auth = require('../middleware/auth');
// const { adminAuth } = require('../middleware/auth');

// // ===== ADMIN ROUTES =====
// // GET all users (Admin only)
// router.get('/', adminAuth, async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
//     const query = {};
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } }
//       ];
//     }
//     if (role) {
//       query.role = role;
//     }

//     const users = await User.find(query)
//       .select('-password')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await User.countDocuments(query);

//     res.json({
//       success: true,
//       users,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET user statistics (Admin only)
// router.get('/stats', adminAuth, async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();
//     const activeUsers = await User.countDocuments({ isActive: true });
//     const usersByRole = await User.aggregate([
//       {
//         $group: {
//           _id: '$role',
//           count: { $sum: 1 }
//         }
//       }
//     ]);
    
//     const recentUsers = await User.find()
//       .select('-password')
//       .sort({ createdAt: -1 })
//       .limit(5);

//     res.json({
//       success: true,
//       stats: {
//         totalUsers,
//         activeUsers,
//         inactiveUsers: totalUsers - activeUsers,
//         usersByRole,
//         recentUsers
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET specific user (Admin only)
// router.get('/:id', adminAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .select('-password')
//       .populate('readingList.book', 'title author coverImage category')
//       .populate('downloadedBooks.book', 'title author coverImage category')
//       .populate('readingStats.favorites', 'title author coverImage');

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // UPDATE user (Admin only)
// router.put('/:id', adminAuth, async (req, res) => {
//   try {
//     const { name, role, isActive } = req.body;
//     const allowedUpdates = ['name', 'role', 'isActive'];
    
//     const updateData = {};
//     allowedUpdates.forEach(field => {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     });

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // DELETE user (Admin only)
// router.delete('/:id', adminAuth, async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.json({ success: true, message: 'User deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ===== USER PROFILE ROUTES (Authenticated Users) =====

// // GET user profile
// router.get('/profile', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('readingList.book', 'title author coverImage pages category')
//       .populate('downloadedBooks.book', 'title author coverImage')
//       .populate('readingStats.favorites', 'title author coverImage')
//       .populate('readingStats.currentlyReading.book', 'title author coverImage pages');
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // UPDATE user profile
// router.put('/profile', auth, async (req, res) => {
//   try {
//     const { name, preferences } = req.body;
//     const allowedUpdates = ['name', 'preferences'];
    
//     const updateData = {};
//     allowedUpdates.forEach(field => {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     });
    
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       updateData,
//       { new: true, runValidators: true }
//     ).select('-password');
    
//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // Add to reading list
// router.post('/reading-list', auth, async (req, res) => {
//     try {
//         const { bookId } = req.body;
//         const userId = req.user._id;

//         // Validate book exists
//         const book = await Book.findById(bookId);
//         if (!book) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Book not found'
//             });
//         }

//         // Find user and add to reading list if not already there
//         const user = await User.findById(userId);
//         if (!user.readingList.includes(bookId)) {
//             user.readingList.push(bookId);
//             await user.save();
//         }

//         res.json({
//             success: true,
//             message: 'Book added to reading list',
//             readingList: user.readingList
//         });

//     } catch (error) {
//         console.error('Error adding to reading list:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error adding to reading list'
//         });
//     }
// });

// // Get reading list
// router.get('/reading-list', auth, async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id).populate('readingList');
        
//         res.json({
//             success: true,
//             readingList: user.readingList
//         });

//     } catch (error) {
//         console.error('Error getting reading list:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error getting reading list'
//         });
//     }
// });

// // Remove from reading list
// router.delete('/reading-list/:bookId', auth, async (req, res) => {
//     try {
//         const { bookId } = req.params;
//         const user = await User.findById(req.user._id);

//         user.readingList = user.readingList.filter(id => id.toString() !== bookId);
//         await user.save();

//         res.json({
//             success: true,
//             message: 'Book removed from reading list',
//             readingList: user.readingList
//         });

//     } catch (error) {
//         console.error('Error removing from reading list:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error removing from reading list'
//         });
//     }
// });
// // ===== FAVORITES ENDPOINTS =====

// // GET favorites
// router.get('/favorites', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('readingStats.favorites', 'title author coverImage description pages category accessLevel');
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     res.json({ success: true, favorites: user.readingStats.favorites });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ADD to favorites
// router.post('/favorites', auth, async (req, res) => {
//   try {
//     const { bookId } = req.body;
    
//     // Check if book exists
//     const book = await Book.findById(bookId);
//     if (!book) {
//       return res.status(404).json({ success: false, message: 'Book not found' });
//     }
    
//     const user = await User.findById(req.user.id);
//     await user.addToFavorites(bookId);
    
//     res.json({ 
//       success: true, 
//       message: 'Book added to favorites'
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // REMOVE from favorites
// router.delete('/favorites/:bookId', auth, async (req, res) => {
//   try {
//     const { bookId } = req.params;
    
//     const user = await User.findById(req.user.id);
//     await user.removeFromFavorites(bookId);
    
//     res.json({ 
//       success: true, 
//       message: 'Book removed from favorites'
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ===== DOWNLOAD TRACKING =====

// // Track book download
// router.post('/track-download', auth, async (req, res) => {
//   try {
//     const { bookId } = req.body;
    
//     // Check if book exists
//     const book = await Book.findById(bookId);
//     if (!book) {
//       return res.status(404).json({ success: false, message: 'Book not found' });
//     }
    
//     // Check access rights for premium books
//     if (book.accessLevel === 'premium') {
//       const user = await User.findById(req.user.id);
//       if (!user.hasPremiumAccess()) {
//         return res.status(403).json({ 
//           success: false, 
//           message: 'Premium subscription required to download this book' 
//         });
//       }
//     }
    
//     // Track download in user's record
//     const user = await User.findById(req.user.id);
//     await user.trackDownload(bookId);
    
//     // Increment book's download count
//     await Book.findByIdAndUpdate(bookId, { $inc: { downloadCount: 1 } });
    
//     res.json({ 
//       success: true, 
//       message: 'Download tracked successfully'
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET download history
// router.get('/downloads', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('downloadedBooks.book', 'title author coverImage category accessLevel downloadCount');
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     res.json({ success: true, downloads: user.downloadedBooks });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ===== USER STATISTICS =====
// router.get('/stats/personal', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('readingStats.currentlyReading.book', 'title author coverImage pages')
//       .populate('readingStats.favorites', 'title author coverImage')
//       .populate('readingList.book', 'title author')
//       .populate('downloadedBooks.book', 'title author');

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     const stats = {
//       totalBooksRead: user.readingStats.totalBooksRead,
//       totalReadingTime: user.readingStats.totalReadingTime,
//       currentlyReading: user.readingStats.currentlyReading,
//       favorites: user.readingStats.favorites,
//       readingListCount: user.readingList.length,
//       downloadedBooksCount: user.downloadedBooks.length,
//       totalDownloads: user.downloadedBooks.reduce((sum, item) => sum + item.downloadCount, 0)
//     };
    
//     res.json({ success: true, stats });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // UPDATE reading progress
// router.put('/reading-progress', auth, async (req, res) => {
//   try {
//     const { bookId, currentPage } = req.body;
    
//     const user = await User.findById(req.user.id);
//     let currentlyReading = user.readingStats.currentlyReading.find(
//       item => item.book.toString() === bookId
//     );
    
//     if (currentlyReading) {
//       currentlyReading.lastPage = currentPage;
//     } else {
//       user.readingStats.currentlyReading.push({
//         book: bookId,
//         lastPage: currentPage
//       });
//     }
    
//     await user.save();
    
//     res.json({ 
//       success: true, 
//       message: 'Reading progress updated'
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // MARK book as completed
// router.post('/reading-complete', auth, async (req, res) => {
//   try {
//     const { bookId } = req.body;
    
//     const user = await User.findById(req.user.id);
    
//     // Remove from currently reading
//     user.readingStats.currentlyReading = user.readingStats.currentlyReading.filter(
//       item => item.book.toString() !== bookId
//     );
    
//     // Increment books read count
//     user.readingStats.totalBooksRead += 1;
    
//     await user.save();
    
//     res.json({ 
//       success: true, 
//       message: 'Book marked as completed'
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ===== PASSWORD MANAGEMENT =====

// // Change password
// router.post('/change-password', auth, async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
    
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Current password and new password are required' 
//       });
//     }
    
//     if (newPassword.length < 6) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'New password must be at least 6 characters long' 
//       });
//     }
    
//     const user = await User.findById(req.user.id).select('+password');
    
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Current password is incorrect' 
//       });
//     }
    
//     user.password = newPassword;
//     await user.save();
    
//     res.json({ 
//       success: true, 
//       message: 'Password changed successfully' 
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// module.exports = router;






















// const express = require('express');
// const router = express.Router();
// const { adminAuth } = require('../middleware/auth');

// // Temporary user routes - we'll implement these later
// router.get('/', adminAuth, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Users endpoint - to be implemented',
//     data: []
//   });
// });

// router.get('/stats', adminAuth, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'User stats endpoint - to be implemented',
//     data: { totalUsers: 0, activeUsers: 0 }
//   });
// });
// // Add reading list endpoints
// router.post('/reading-list', auth, async (req, res) => {
//     try {
//         const { bookId } = req.body;
//         const userId = req.user.id;
        
//         // Add book to user's reading list
//         const user = await User.findByIdAndUpdate(
//             userId,
//             { $addToSet: { readingList: bookId } },
//             { new: true }
//         );
        
//         res.json({ success: true, message: 'Added to reading list' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// });

// // Add download tracking endpoint in books routes
// router.post('/books/:id/download', auth, async (req, res) => {
//     try {
//         const bookId = req.params.id;
        
//         // Increment download count
//         await Book.findByIdAndUpdate(bookId, { $inc: { downloadCount: 1 } });
        
//         // Track user download (optional)
//         await User.findByIdAndUpdate(req.user.id, {
//             $addToSet: { downloadedBooks: bookId },
//             $inc: { totalDownloads: 1 }
//         });
        
//         res.json({ success: true, message: 'Download tracked' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// });
// module.exports = router;