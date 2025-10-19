const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// SIMPLIFIED Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = 'uploads/';
    
    if (file.fieldname === 'coverImage') {
      uploadDir = 'uploads/covers/';
    } else if (file.fieldname === 'pdfFile') {
      uploadDir = 'uploads/books/';
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// POST /api/books - Create a new book
router.post('/', auth, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== BACKEND RECEIVED REQUEST ===');
    console.log('📦 Request Body:', req.body);
    console.log('📁 Request Files:', req.files);
    console.log('👤 Request User:', req.user);

    // Check if body data exists
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ NO BODY DATA RECEIVED');
      return res.status(400).json({
        success: false,
        message: 'No form data received'
      });
    }

    // Extract ALL fields from body
    const {
      title,
      author,
      description,
      isbn,
      category,
      language,
      pages,
      publicationYear,
      publisher,
      accessLevel,
      tags
    } = req.body;

    console.log('📋 EXTRACTED FIELDS:');
    console.log('Title:', title);
    console.log('Author:', author);
    console.log('Description:', description);
    console.log('ISBN:', isbn);
    console.log('Category:', category);
    console.log('Language:', language);
    console.log('Pages:', pages);
    console.log('Publication Year:', publicationYear);
    console.log('Publisher:', publisher);
    console.log('Access Level:', accessLevel);
    console.log('Tags:', tags);

    // Validate required text fields
    if (!title || !author || !description || !category || !pages || !publicationYear || !publisher) {
      console.log('❌ MISSING REQUIRED FIELDS');
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Validate files
    if (!req.files?.coverImage) {
      console.log('❌ NO COVER IMAGE');
      return res.status(400).json({
        success: false,
        message: 'Cover image is required'
      });
    }

    if (!req.files?.pdfFile) {
      console.log('❌ NO PDF FILE');
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    console.log('✅ ALL VALIDATIONS PASSED');

    // Handle file paths
    const coverImagePath = `/uploads/covers/${req.files.coverImage[0].filename}`;
    const pdfFilePath = `/uploads/books/${req.files.pdfFile[0].filename}`;
    const fileSize = req.files.pdfFile[0].size;

    console.log('📁 FILE PATHS:');
    console.log('Cover Image:', coverImagePath);
    console.log('PDF File:', pdfFilePath);
    console.log('File Size:', fileSize);

    // Prepare book data with ALL required fields
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      isbn: isbn?.trim() || undefined,
      category: category,
      language: language || 'English',
      pages: parseInt(pages),
      publicationYear: parseInt(publicationYear),
      publisher: publisher.trim(),
      accessLevel: accessLevel || 'public',
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      coverImage: coverImagePath,
      pdfFile: pdfFilePath,
      fileSize: fileSize,
      uploadedBy: req.user._id || req.user.id
    };

    console.log('📚 FINAL BOOK DATA:', bookData);

    // Create and save book
    const book = new Book(bookData);
    const savedBook = await book.save();
    
    await savedBook.populate('uploadedBy', 'name email');
    
    console.log('✅ BOOK CREATED SUCCESSFULLY:', savedBook._id);
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book: savedBook
    });
    
  } catch (error) {
    console.error('❌ BOOK CREATION ERROR:', error);
    
    // Clean up uploaded files if book creation fails
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log('🧹 Cleaned up file:', file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        });
      });
    }

    // Handle specific errors
    if (error.code === 11000 && error.keyPattern?.isbn) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('❌ VALIDATION ERRORS:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating book',
      error: error.message
    });
  }
});

// GET /api/books - Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find({ isActive: true })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      books: books,
      count: books.length
    });
  } catch (error) {
    console.error('❌ Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
});


// DELETE book by ID - UPDATED VERSION
router.delete('/:id', auth, async (req, res) => {
    try {
        const bookId = req.params.id;
        console.log('🗑️ Deleting book with ID:', bookId);

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Optional: Check if user has permission to delete
        // Only allow admin or the user who uploaded the book to delete it
        const isAdmin = req.user.role === 'admin';
        const isUploader = book.uploadedBy && book.uploadedBy.toString() === req.user._id.toString();
        
        if (!isAdmin && !isUploader) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this book'
            });
        }

        // Delete the book
        await Book.findByIdAndDelete(bookId);

        console.log('✅ Book deleted successfully:', bookId);

        res.json({
            success: true,
            message: 'Book deleted successfully',
            deletedBookId: bookId
        });

    } catch (error) {
        console.error('❌ Error deleting book:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// PUT /api/books/:id - Update a book
router.put('/:id', auth, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log('📝 Updating book with ID:', bookId);
    console.log('📦 Request Body:', req.body);
    console.log('📁 Request Files:', req.files);

    // Check if book exists
    const existingBook = await Book.findById(bookId);
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check permissions - only admin or uploader can edit
    const isAdmin = req.user.role === 'admin';
    const isUploader = existingBook.uploadedBy && existingBook.uploadedBy.toString() === req.user._id.toString();
    
    if (!isAdmin && !isUploader) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this book'
      });
    }

    // Extract fields from body
    const {
      title,
      author,
      description,
      isbn,
      category,
      language,
      pages,
      publicationYear,
      publisher,
      accessLevel,
      tags,
      isActive,
      isFeatured
    } = req.body;

    // Prepare update data
    const updateData = {
      title: title?.trim(),
      author: author?.trim(),
      description: description?.trim(),
      isbn: isbn?.trim(),
      category: category,
      language: language,
      pages: pages ? parseInt(pages) : undefined,
      publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
      publisher: publisher?.trim(),
      accessLevel: accessLevel,
      isActive: isActive !== undefined ? isActive : existingBook.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured : existingBook.isFeatured
    };

    // Handle tags
    if (tags) {
      updateData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Handle file updates
    if (req.files?.coverImage) {
      updateData.coverImage = `/uploads/covers/${req.files.coverImage[0].filename}`;
      
      // Delete old cover image if it exists
      if (existingBook.coverImage) {
        const oldCoverPath = path.join(__dirname, '..', existingBook.coverImage);
        try {
          if (fs.existsSync(oldCoverPath)) {
            fs.unlinkSync(oldCoverPath);
            console.log('🗑️ Deleted old cover image:', oldCoverPath);
          }
        } catch (fileError) {
          console.warn('⚠️ Could not delete old cover image:', fileError.message);
        }
      }
    }

    if (req.files?.pdfFile) {
      updateData.pdfFile = `/uploads/books/${req.files.pdfFile[0].filename}`;
      updateData.fileSize = req.files.pdfFile[0].size;
      
      // Delete old PDF file if it exists
      if (existingBook.pdfFile) {
        const oldPdfPath = path.join(__dirname, '..', existingBook.pdfFile);
        try {
          if (fs.existsSync(oldPdfPath)) {
            fs.unlinkSync(oldPdfPath);
            console.log('🗑️ Deleted old PDF file:', oldPdfPath);
          }
        } catch (fileError) {
          console.warn('⚠️ Could not delete old PDF file:', fileError.message);
        }
      }
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('📝 Final update data:', updateData);

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    console.log('✅ Book updated successfully:', updatedBook._id);

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (error) {
    console.error('❌ Error updating book:', error);

    // Clean up newly uploaded files if update fails
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log('🧹 Cleaned up uploaded file:', file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        });
      });
    }

    // Handle specific errors
    if (error.code === 11000 && error.keyPattern?.isbn) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating book',
      error: error.message
    });
  }
});

// GET /api/books/:id - Get single book
router.get('/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log('📖 Fetching book with ID:', bookId);

    const book = await Book.findById(bookId).populate('uploadedBy', 'name email');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      book: book
    });

  } catch (error) {
    console.error('❌ Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching book',
      error: error.message
    });
  }
});

// Track book download
router.post('/:id/download', auth, async (req, res) => {
  try {
    const bookId = req.params.id;
    
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
    
    // Increment download count
    await Book.findByIdAndUpdate(bookId, { $inc: { downloadCount: 1 } });
    
    // Track user download
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { downloadedBooks: { book: bookId } },
      $inc: { 'downloadedBooks.$.downloadCount': 1 }
    });
    
    res.json({ 
      success: true, 
      message: 'Download tracked successfully',
      downloadUrl: book.pdfFile // Return the actual file URL
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;     
