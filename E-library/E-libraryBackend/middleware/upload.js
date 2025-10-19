// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    './uploads/books/covers',
    './uploads/books/pdfs'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration for cover images
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/books/covers');
  },
  filename: (req, file, cb) => {
    const uniqueName = `cover-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for PDF files
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/books/pdfs');
  },
  filename: (req, file, cb) => {
    const uniqueName = `book-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for cover images'), false);
  }
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Multer instances
const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for cover images
  }
});

const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for PDF files
  }
});

module.exports = {
  uploadCover,
  uploadPDF
};