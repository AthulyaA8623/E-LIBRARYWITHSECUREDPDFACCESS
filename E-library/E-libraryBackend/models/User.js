const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'moderator'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        }
    },
    // READING LIST
    readingList: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            default: ''
        },
        isFavorite: {
            type: Boolean,
            default: false
        },
        lastRead: {
            type: Date
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    }],
    // ADD THESE MISSING FIELDS:
    readingStats: {
        totalBooksRead: {
            type: Number,
            default: 0
        },
        totalReadingTime: {
            type: Number, // in minutes
            default: 0
        },
        currentlyReading: [{
            book: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            },
            lastPage: {
                type: Number,
                default: 0
            },
            startedAt: {
                type: Date,
                default: Date.now
            }
        }],
        favorites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        }]
    },
    downloadedBooks: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true
        },
        downloadedAt: {
            type: Date,
            default: Date.now
        },
        downloadCount: {
            type: Number,
            default: 1
        }
    }]
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'readingList.book': 1 });

// Hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

// ===== ADD THESE MISSING METHODS =====

// Method to add book to reading list
userSchema.methods.addToReadingList = async function(bookId, notes = '') {
    const existingItem = this.readingList.find(item => item.book.toString() === bookId);
    
    if (existingItem) {
        throw new Error('Book already in reading list');
    }
    
    this.readingList.push({
        book: bookId,
        addedAt: new Date(),
        notes: notes
    });
    
    return await this.save();
};

// Method to remove book from reading list
userSchema.methods.removeFromReadingList = async function(bookId) {
    const initialLength = this.readingList.length;
    this.readingList = this.readingList.filter(item => item.book.toString() !== bookId);
    
    if (this.readingList.length === initialLength) {
        throw new Error('Book not found in reading list');
    }
    
    return await this.save();
};

// Method to add book to favorites
userSchema.methods.addToFavorites = async function(bookId) {
    if (!this.readingStats.favorites.includes(bookId)) {
        this.readingStats.favorites.push(bookId);
        return await this.save();
    }
    return this;
};

// Method to remove book from favorites
userSchema.methods.removeFromFavorites = async function(bookId) {
    this.readingStats.favorites = this.readingStats.favorites.filter(
        fav => fav.toString() !== bookId
    );
    return await this.save();
};

// Method to track download
userSchema.methods.trackDownload = async function(bookId) {
    const existingDownload = this.downloadedBooks.find(
        item => item.book.toString() === bookId
    );
    
    if (existingDownload) {
        existingDownload.downloadCount += 1;
        existingDownload.downloadedAt = new Date();
    } else {
        this.downloadedBooks.push({
            book: bookId,
            downloadedAt: new Date(),
            downloadCount: 1
        });
    }
    
    return await this.save();
};

// Method to check premium access
userSchema.methods.hasPremiumAccess = function() {
    return this.role === 'admin' || this.role === 'premium';
};

module.exports = mongoose.model('User', userSchema);



















// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Name is required'],
//     trim: true,
//     maxlength: [100, 'Name cannot exceed 100 characters']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [6, 'Password must be at least 6 characters'],
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'user', 'moderator'],
//     default: 'user'
//   },
//   avatar: {
//     type: String,
//     default: null
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   lastLogin: {
//     type: Date,
//     default: null
//   },
//   preferences: {
//     notifications: {
//       type: Boolean,
//       default: true
//     },
//     theme: {
//       type: String,
//       enum: ['light', 'dark'],
//       default: 'light'
//     }
//   }
// }  ,{
//   timestamps: true
// });

// // Index for better query performance
// userSchema.index({ email: 1 });
// userSchema.index({ role: 1 });
// userSchema.index({ createdAt: -1 });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Remove password from JSON output
// userSchema.methods.toJSON = function() {
//   const user = this.toObject();
//   delete user.password;
//   return user;
// };

// module.exports = mongoose.model('User', userSchema);