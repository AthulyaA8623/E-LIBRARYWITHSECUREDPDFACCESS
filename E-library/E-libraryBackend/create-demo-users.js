const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elibrary');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User model (same as your User.js)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'moderator'],
    default: 'user'
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
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Create demo users
const createDemoUsers = async () => {
  try {
    await connectDB();
    
    console.log('🔧 Creating demo users...');
    
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@elibrary.com',
        password: 'Admin123!',
        role: 'admin'
      },
      {
        name: 'John Reader',
        email: 'user@elibrary.com',
        password: 'User123!',
        role: 'user'
      }
    ];

    for (let userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️ User ${userData.email} already exists, updating...`);
        // Update existing user
        existingUser.name = userData.name;
        existingUser.password = userData.password; // Will be hashed by pre-save hook
        existingUser.role = userData.role;
        await existingUser.save();
      } else {
        // Create new user
        const user = new User(userData);
        await user.save();
      }
      console.log(`✅ ${existingUser ? 'Updated' : 'Created'} user: ${userData.email}`);
    }
    
    console.log('🎉 Demo users created/updated successfully!');
    
    // Show all users
    const allUsers = await User.find({}, 'name email role createdAt');
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

createDemoUsers();