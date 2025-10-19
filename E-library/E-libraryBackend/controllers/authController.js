// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');

// // Generate JWT token
// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || '7d'
//   });
// };

// // Register new user
// const register = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { name, email, password, role } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists with this email'
//       });
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role: role || 'user'
//     });

//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       data: {
//         user,
//         token
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error registering user',
//       error: error.message
//     });
//   }
// };

// // Login user
// const login = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { email, password } = req.body;

//     // Find user and include password for comparison
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Account is deactivated. Please contact administrator.'
//       });
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         user: await User.findById(user._id), // Get user without password
//         token
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error logging in',
//       error: error.message
//     });
//   }
// };

// // Get current user
// const getMe = async (req, res) => {
//   try {
//     res.status(200).json({
//       success: true,
//       data: req.user
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching user data',
//       error: error.message
//     });
//   }
// };

// // Update user profile
// const updateProfile = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { name, preferences } = req.body;
//     const updateData = {};

//     if (name) updateData.name = name;
//     if (preferences) updateData.preferences = preferences;

//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: user
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating profile',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   register,
//   login,
//   getMe,
//   updateProfile
// };









// const User = require('../models/User');
// const jwt = require('jsonwebtoken');

// // Generate JWT Token
// const generateToken = (userId, role) => {
//   return jwt.sign(
//     { id: userId, role }, 
//     process.env.JWT_SECRET, 
//     { expiresIn: '7d' }
//   );
// };

// // ✅ Register User
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: 'User already exists with this email'
//       });
//     }

//     // Create new user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role: role || 'user'
//     });

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate token
//     const token = generateToken(user._id, user.role);

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar,
//         preferences: user.preferences,
//         lastLogin: user.lastLogin,
//         createdAt: user.createdAt
//       }
//     });

//   } catch (error) {
//     console.error('Register Error:', error);
    
//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: messages.join(', ')
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Server error during registration'
//     });
//   }
// };

// // ✅ Login User
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user and include password for comparison
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Account has been deactivated'
//       });
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate token
//     const token = generateToken(user._id, user.role);

//     res.json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar,
//         preferences: user.preferences,
//         lastLogin: user.lastLogin,
//         createdAt: user.createdAt
//       }
//     });

//   } catch (error) {
//     console.error('Login Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login'
//     });
//   }
// };

// // ✅ Get Current User Profile
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
    
//     res.json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     console.error('Get Profile Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// // ✅ Update User Profile
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, preferences } = req.body;
    
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { 
//         name,
//         preferences: { ...req.user.preferences, ...preferences }
//       },
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       user
//     });
//   } catch (error) {
//     console.error('Update Profile Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

























const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role }, 
    process.env.JWT_SECRET || 'fallback_secret', 
    { expiresIn: '7d' }
  );
};

// ✅ Register User
exports.register = async (req, res) => {
  try {
    console.log('🔧 Registration attempt:', req.body);
    
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save middleware
      role: role || 'user'
    });

    // Save user to database
    await user.save();
    console.log('✅ User saved to database:', user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Register Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// ✅ Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};