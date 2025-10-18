// routes/reading-list.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const { auth } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Reading list routes working!' 
    });
});

// Get user's reading list
router.get('/', auth, async (req, res) => {
    try {
        console.log('📖 GET /reading-list called for user:', req.user.id);
        
        const user = await User.findById(req.user.id)
            .populate('readingList.book', 'title author coverImage pages category accessLevel pdfFile description publicationYear isbn')
            .select('readingList');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log(`✅ Found ${user.readingList.length} books in reading list`);
        
        res.json({
            success: true,
            readingList: user.readingList || []
        });

    } catch (error) {
        console.error('❌ Error fetching reading list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Add to reading list
router.post('/', auth, async (req, res) => {
    try {
        const { bookId } = req.body;
        
        console.log('📖 POST /reading-list called with bookId:', bookId);
        
        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'Book ID is required'
            });
        }

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        const user = await User.findById(req.user.id);
        
        // Check if already in reading list
        const existing = user.readingList.find(item => 
            item.book && item.book.toString() === bookId
        );
        
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Book already in reading list'
            });
        }

        // Add to reading list
        user.readingList.push({
            book: bookId,
            addedAt: new Date()
        });

        await user.save();

        console.log(`✅ Book "${book.title}" added to reading list for user: ${user.name}`);
        
        res.json({
            success: true,
            message: 'Book added to reading list'
        });

    } catch (error) {
        console.error('❌ Error adding to reading list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Remove from reading list
router.delete('/:bookId', auth, async (req, res) => {
    try {
        const { bookId } = req.params;
        
        console.log('📖 DELETE /reading-list called with bookId:', bookId);

        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove from reading list
        const initialLength = user.readingList.length;
        user.readingList = user.readingList.filter(item => 
            item.book && item.book.toString() !== bookId
        );
        
        if (user.readingList.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in reading list'
            });
        }

        await user.save();

        console.log(`✅ Book removed from reading list for user: ${user.name}`);
        
        res.json({
            success: true,
            message: 'Book removed from reading list'
        });

    } catch (error) {
        console.error('❌ Error removing from reading list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update reading list item (notes, progress, etc.)
router.put('/:bookId', auth, async (req, res) => {
    try {
        const { bookId } = req.params;
        const { notes, progress, isFavorite } = req.body;
        
        console.log('📖 PUT /reading-list called with bookId:', bookId);

        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find the reading list item
        const readingItem = user.readingList.find(item => 
            item.book && item.book.toString() === bookId
        );
        
        if (!readingItem) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in reading list'
            });
        }

        // Update fields if provided
        if (notes !== undefined) readingItem.notes = notes;
        if (progress !== undefined) {
            if (progress >= 0 && progress <= 100) {
                readingItem.progress = progress;
                readingItem.lastRead = new Date();
            }
        }
        if (isFavorite !== undefined) readingItem.isFavorite = isFavorite;

        await user.save();

        console.log(`✅ Reading list item updated for user: ${user.name}`);
        
        res.json({
            success: true,
            message: 'Reading list updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating reading list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Toggle favorite status
router.post('/:bookId/favorite', auth, async (req, res) => {
    try {
        const { bookId } = req.params;
        
        console.log('📖 POST /reading-list/favorite called with bookId:', bookId);

        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find the reading list item
        const readingItem = user.readingList.find(item => 
            item.book && item.book.toString() === bookId
        );
        
        if (!readingItem) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in reading list'
            });
        }

        // Toggle favorite status
        readingItem.isFavorite = !readingItem.isFavorite;
        await user.save();

        const action = readingItem.isFavorite ? 'added to' : 'removed from';
        
        console.log(`✅ Book ${action} favorites for user: ${user.name}`);
        
        res.json({
            success: true,
            message: `Book ${action} favorites`,
            isFavorite: readingItem.isFavorite
        });

    } catch (error) {
        console.error('❌ Error toggling favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// routes/reading-list.js - Add this route if not exists

// Get comprehensive user stats
// router.get('/user/stats', auth, async (req, res) => {
//     try {
//         console.log('📊 GET /reading-list/user/stats called for user:', req.user.id);
        
//         const user = await User.findById(req.user.id)
//             .populate('readingStats.favorites', 'title author coverImage')
//             .populate('readingStats.currentlyReading.book', 'title author pages')
//             .populate('downloadedBooks.book', 'title author')
//             .select('readingList readingStats downloadedBooks');

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         // Calculate comprehensive stats
//         const stats = {
//             // Reading list stats
//             totalBooks: user.readingList.length,
//             readingNow: user.readingList.filter(item => item.progress > 0 && item.progress < 100).length,
//             completed: user.readingList.filter(item => item.progress === 100).length,
//             favorites: user.readingList.filter(item => item.isFavorite).length,
            
//             // Reading stats
//             totalBooksRead: user.readingStats.totalBooksRead || 0,
//             totalReadingTime: user.readingStats.totalReadingTime || 0,
            
//             // Download stats
//             downloadedBooksCount: user.downloadedBooks.length || 0,
            
//             // Additional stats
//             readingListCount: user.readingList.length,
//             favoriteBooks: user.readingStats.favorites || []
//         };

//         console.log(`✅ User stats loaded for ${user.name}:`, stats);
        
//         res.json({
//             success: true,
//             stats: stats
//         });

//     } catch (error) {
//         console.error('❌ Error fetching user stats:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error fetching stats'
//         });
//     }
// });
// In routes/reading-list.js - Add this route

// Get reading list stats
router.get('/stats', auth, async (req, res) => {
    try {
        console.log('📊 GET /reading-list/stats called for user:', req.user.id);
        
        const user = await User.findById(req.user.id).select('readingList');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const stats = {
            totalBooks: user.readingList.length,
            readingNow: user.readingList.filter(item => item.progress > 0 && item.progress < 100).length,
            completed: user.readingList.filter(item => item.progress === 100).length,
            favorites: user.readingList.filter(item => item.isFavorite).length,
            notStarted: user.readingList.filter(item => item.progress === 0).length
        };

        console.log(`✅ Reading list stats for user ${user.name}:`, stats);
        
        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Error fetching reading list stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats'
        });
    }
});




// Get reading list stats
// router.get('/stats', auth, async (req, res) => {
//     try {
//         console.log('📖 GET /reading-list/stats called for user:', req.user.id);
        
//         const user = await User.findById(req.user.id).select('readingList');

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         const stats = {
//             totalBooks: user.readingList.length,
//             readingNow: user.readingList.filter(item => item.progress > 0 && item.progress < 100).length,
//             completed: user.readingList.filter(item => item.progress === 100).length,
//             favorites: user.readingList.filter(item => item.isFavorite).length,
//             notStarted: user.readingList.filter(item => item.progress === 0).length
//         };

//         console.log(`✅ Reading list stats for user ${user.name}:`, stats);
        
//         res.json({
//             success: true,
//             stats: stats
//         });

//     } catch (error) {
//         console.error('❌ Error fetching reading list stats:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error'
//         });
//     }
// });

module.exports = router;