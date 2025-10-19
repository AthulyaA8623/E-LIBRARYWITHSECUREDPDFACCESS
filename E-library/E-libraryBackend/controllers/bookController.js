const Book = require('../models/Book');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Get all books with filtering, sorting, and pagination
const getBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (featured !== undefined) {
      filter.isFeatured = featured === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const books = await Book.find(filter)
      .populate('metadata.uploadedBy', 'name email')
      .populate('metadata.lastUpdatedBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Book.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
};

// Get single book by ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('metadata.uploadedBy', 'name email')
      .populate('metadata.lastUpdatedBy', 'name email');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Increment view count
    book.views += 1;
    await book.save();

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching book',
      error: error.message
    });
  }
};

// Create new book
const createBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookData = {
      ...req.body,
      metadata: {
        uploadedBy: req.user.id,
        lastUpdatedBy: req.user.id
      }
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.coverImage) {
        bookData.coverImage = `/uploads/covers/${req.files.coverImage[0].filename}`;
      }
      if (req.files.fileUrl) {
        bookData.fileUrl = `/uploads/books/${req.files.fileUrl[0].filename}`;
        bookData.fileSize = req.files.fileUrl[0].size;
      }
    }

    const book = new Book(bookData);
    await book.save();

    const populatedBook = await Book.findById(book._id)
      .populate('metadata.uploadedBy', 'name email')
      .populate('metadata.lastUpdatedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: populatedBook
    });
  } catch (error) {
    // Clean up uploaded files if book creation fails
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating book',
      error: error.message
    });
  }
};

// Update book
const updateBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const updateData = {
      ...req.body,
      'metadata.lastUpdatedBy': req.user.id
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.coverImage) {
        // Delete old cover image if exists
        if (book.coverImage && fs.existsSync(path.join(__dirname, '..', book.coverImage))) {
          fs.unlinkSync(path.join(__dirname, '..', book.coverImage));
        }
        updateData.coverImage = `/uploads/covers/${req.files.coverImage[0].filename}`;
      }
      if (req.files.fileUrl) {
        // Delete old book file if exists
        if (book.fileUrl && fs.existsSync(path.join(__dirname, '..', book.fileUrl))) {
          fs.unlinkSync(path.join(__dirname, '..', book.fileUrl));
        }
        updateData.fileUrl = `/uploads/books/${req.files.fileUrl[0].filename}`;
        updateData.fileSize = req.files.fileUrl[0].size;
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('metadata.uploadedBy', 'name email')
     .populate('metadata.lastUpdatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating book',
      error: error.message
    });
  }
};

// Delete book
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Delete associated files
    if (book.coverImage && fs.existsSync(path.join(__dirname, '..', book.coverImage))) {
      fs.unlinkSync(path.join(__dirname, '..', book.coverImage));
    }
    if (book.fileUrl && fs.existsSync(path.join(__dirname, '..', book.fileUrl))) {
      fs.unlinkSync(path.join(__dirname, '..', book.fileUrl));
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting book',
      error: error.message
    });
  }
};

// Bulk delete books
const bulkDeleteBooks = async (req, res) => {
  try {
    const { bookIds } = req.body;

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No book IDs provided'
      });
    }

    const books = await Book.find({ _id: { $in: bookIds } });

    // Delete files for each book
    books.forEach(book => {
      if (book.coverImage && fs.existsSync(path.join(__dirname, '..', book.coverImage))) {
        fs.unlinkSync(path.join(__dirname, '..', book.coverImage));
      }
      if (book.fileUrl && fs.existsSync(path.join(__dirname, '..', book.fileUrl))) {
        fs.unlinkSync(path.join(__dirname, '..', book.fileUrl));
      }
    });

    await Book.deleteMany({ _id: { $in: bookIds } });

    res.status(200).json({
      success: true,
      message: `${bookIds.length} books deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting books',
      error: error.message
    });
  }
};

// Get book statistics
const getBookStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const activeBooks = await Book.countDocuments({ status: 'active' });
    const featuredBooks = await Book.countDocuments({ isFeatured: true, status: 'active' });
    const totalDownloads = await Book.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]);

    const categoryStats = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentBooks = await Book.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title author downloads createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        activeBooks,
        featuredBooks,
        totalDownloads: totalDownloads[0]?.total || 0,
        categoryStats,
        recentBooks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching book statistics',
      error: error.message
    });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  bulkDeleteBooks,
  getBookStats
};