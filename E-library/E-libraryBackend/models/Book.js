
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Self-Help', 'Business', 'Other']
  },
  coverImage: {
    type: String,
    required: [true, 'Cover image is required'] // CHANGED: Added required back
  },
  pdfFile: {
    type: String,
    required: [true, 'PDF file is required'] // CHANGED: Added required back
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'] // CHANGED: Added required back
  },
  pages: {
    type: Number,
    required: [true, 'Pages count is required'],
    min: [1, 'Pages must be at least 1']
  },
  publicationYear: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear(), 'Publication year cannot be in the future']
  },
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
    trim: true
  },
  language: {
    type: String,
    required: [true, 'Language is required'], // CHANGED: Added required
    default: 'English'
  },
  accessLevel: {
    type: String,
    enum: ['public', 'premium', 'admin'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for book URL
bookSchema.virtual('url').get(function() {
  return `/books/${this._id}`;
});

// Virtual for cover image URL
bookSchema.virtual('coverImageUrl').get(function() {
  return this.coverImage;
});

// Virtual for PDF file URL
bookSchema.virtual('pdfFileUrl').get(function() {
  return this.pdfFile;
});

// Instance method to increment download count
bookSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Instance method to increment view count
bookSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to get featured books
bookSchema.statics.getFeaturedBooks = function(limit = 5) {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  })
  .populate('uploadedBy', 'name email')
  .limit(limit)
  .sort({ createdAt: -1 });
};

// Static method to get books by category
bookSchema.statics.getBooksByCategory = function(category, limit = 10) {
  return this.find({ 
    category: category, 
    isActive: true 
  })
  .populate('uploadedBy', 'name email')
  .limit(limit)
  .sort({ createdAt: -1 });
};

// Static method to search books
bookSchema.statics.searchBooks = function(query, limit = 10) {
  return this.find({
    $text: { $search: query },
    isActive: true
  })
  .populate('uploadedBy', 'name email')
  .limit(limit)
  .sort({ score: { $meta: 'textScore' } });
};

// Indexes for better performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ accessLevel: 1 });
bookSchema.index({ isFeatured: 1 });
bookSchema.index({ isActive: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ publicationYear: -1 });
bookSchema.index({ uploadedBy: 1 });

// Ensure virtual fields are serialized
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);       










// const mongoose = require('mongoose');

// const bookSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: [true, 'Title is required'],
//     trim: true,
//     maxlength: [200, 'Title cannot exceed 200 characters']
//   },
//   author: {
//     type: String,
//     required: [true, 'Author is required'],
//     trim: true
//   },
//   description: {
//     type: String,
//     required: [true, 'Description is required'],
//     maxlength: [1000, 'Description cannot exceed 1000 characters']
//   },
//   isbn: {
//     type: String,
//     unique: true,
//     sparse: true,
//     trim: true
//   },
//   category: {
//     type: String,
//     required: [true, 'Category is required'],
//     enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Self-Help', 'Business', 'Other']
//   },
//   coverImage: {
//     type: String,
//     required: [true, 'Cover image is required'] // CHANGED: Added required back
//   },
//   pdfFile: {
//     type: String,
//     required: [true, 'PDF file is required'] // CHANGED: Added required back
//   },
//   fileSize: {
//     type: Number,
//     required: [true, 'File size is required'] // CHANGED: Added required back
//   },
//   pages: {
//     type: Number,
//     required: [true, 'Pages count is required'],
//     min: [1, 'Pages must be at least 1']
//   },
//   publicationYear: {
//     type: Number,
//     required: [true, 'Publication year is required'],
//     min: [1000, 'Publication year must be valid'],
//     max: [new Date().getFullYear(), 'Publication year cannot be in the future']
//   },
//   publisher: {
//     type: String,
//     required: [true, 'Publisher is required'],
//     trim: true
//   },
//   language: {
//     type: String,
//     required: [true, 'Language is required'], // CHANGED: Added required
//     default: 'English'
//   },
//   accessLevel: {
//     type: String,
//     enum: ['public', 'premium', 'admin'],
//     default: 'public'
//   },
//   tags: [{
//     type: String,
//     trim: true
//   }],
//   isFeatured: {
//     type: Boolean,
//     default: false
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   uploadedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   downloadCount: {
//     type: Number,
//     default: 0
//   },
//   viewCount: {
//     type: Number,
//     default: 0
//   }
// }, {
//   timestamps: true
// });

// // Virtual for book URL
// bookSchema.virtual('url').get(function() {
//   return `/books/${this._id}`;
// });

// // Virtual for cover image URL
// bookSchema.virtual('coverImageUrl').get(function() {
//   return this.coverImage;
// });

// // Virtual for PDF file URL
// bookSchema.virtual('pdfFileUrl').get(function() {
//   return this.pdfFile;
// });

// // Instance method to increment download count
// bookSchema.methods.incrementDownloadCount = function() {
//   this.downloadCount += 1;
//   return this.save();
// };

// // Instance method to increment view count
// bookSchema.methods.incrementViewCount = function() {
//   this.viewCount += 1;
//   return this.save();
// };

// // Static method to get featured books
// bookSchema.statics.getFeaturedBooks = function(limit = 5) {
//   return this.find({ 
//     isFeatured: true, 
//     isActive: true 
//   })
//   .populate('uploadedBy', 'name email')
//   .limit(limit)
//   .sort({ createdAt: -1 });
// };

// // Static method to get books by category
// bookSchema.statics.getBooksByCategory = function(category, limit = 10) {
//   return this.find({ 
//     category: category, 
//     isActive: true 
//   })
//   .populate('uploadedBy', 'name email')
//   .limit(limit)
//   .sort({ createdAt: -1 });
// };

// // Static method to search books
// bookSchema.statics.searchBooks = function(query, limit = 10) {
//   return this.find({
//     $text: { $search: query },
//     isActive: true
//   })
//   .populate('uploadedBy', 'name email')
//   .limit(limit)
//   .sort({ score: { $meta: 'textScore' } });
// };

// // Indexes for better performance
// bookSchema.index({ title: 'text', author: 'text', description: 'text' });
// bookSchema.index({ category: 1 });
// bookSchema.index({ accessLevel: 1 });
// bookSchema.index({ isFeatured: 1 });
// bookSchema.index({ isActive: 1 });
// bookSchema.index({ createdAt: -1 });
// bookSchema.index({ publicationYear: -1 });
// bookSchema.index({ uploadedBy: 1 });

// // Ensure virtual fields are serialized
// bookSchema.set('toJSON', { virtuals: true });
// bookSchema.set('toObject', { virtuals: true });

// module.exports = mongoose.model('Book', bookSchema);









// const mongoose = require('mongoose');

// const bookSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: [true, 'Title is required'],
//     trim: true,
//     maxlength: [200, 'Title cannot exceed 200 characters']
//   },
//   author: {
//     type: String,
//     required: [true, 'Author is required'],
//     trim: true
//   },
//   description: {
//     type: String,
//     required: [true, 'Description is required'],
//     maxlength: [1000, 'Description cannot exceed 1000 characters']
//   },
//   isbn: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   category: {
//     type: String,
//     required: [true, 'Category is required'],
//     enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Self-Help', 'Business', 'Other']
//   },
//   coverImage: {
//     type: String,
//     default: '' // TEMPORARY: Remove required
//   },
//   pdfFile: {
//     type: String,
//     default: '' // TEMPORARY: Remove required
//   },
//   fileSize: {
//     type: Number,
//     default: 0 // TEMPORARY: Remove required
//   },
//   pages: {
//     type: Number,
//     required: [true, 'Pages count is required'],
//     min: [1, 'Pages must be at least 1']
//   },
//   publicationYear: {
//     type: Number,
//     required: [true, 'Publication year is required'],
//     min: [1000, 'Publication year must be valid'],
//     max: [new Date().getFullYear(), 'Publication year cannot be in the future']
//   },
//   publisher: {
//     type: String,
//     required: [true, 'Publisher is required'],
//     trim: true
//   },
//   language: {
//     type: String,
//     default: 'English'
//   },
//   accessLevel: {
//     type: String,
//     enum: ['public', 'premium', 'admin'],
//     default: 'public'
//   },
//   tags: [String],
//   isFeatured: {
//     type: Boolean,
//     default: false
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   uploadedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   downloadCount: {
//     type: Number,
//     default: 0
//   },
//   viewCount: {
//     type: Number,
//     default: 0
//   }
// }, {
//   timestamps: true
// });

// // Indexes for better performance
// bookSchema.index({ title: 'text', author: 'text', description: 'text' });
// bookSchema.index({ category: 1 });
// bookSchema.index({ accessLevel: 1 });
// bookSchema.index({ isFeatured: 1 });
// bookSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Book', bookSchema);

