const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const router = express.Router();

console.log('✅ Auth routes with database loaded!');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role }, 
    process.env.JWT_SECRET || 'fallback-secret', 
    { expiresIn: '7d' }
  );
};

// ✅ Register User - SAVES TO DATABASE
router.post('/register', async (req, res) => {
  try {
    console.log('🔧 Registration attempt:', { ...req.body, password: '***' });
    
    const { name, email, password } = req.body;

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

    // Create new user - THIS SAVES TO MONGODB
    const user = new User({
      name,
      email,
      password,
      role: 'user'
    });

    // Save user to MongoDB database
    await user.save();
    console.log('✅ User saved to MongoDB database:', user._id);

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
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// ✅ Login User - CHECKS DATABASE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in MongoDB
    const user = await User.findOne({ email }).select('+password');
    
    if (!user|| !(await user.comparePassword(password))) {
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
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});
// In your routes/auth.js, add these if they don't exist:

// routes/auth.js - Add these routes

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        console.log('📋 GET /auth/profile called for user:', req.user.id);
        
        const user = await User.findById(req.user.id)
            .select('-password') // Exclude password
            .populate('readingStats.favorites', 'title author')
            .populate('readingStats.currentlyReading.book', 'title author');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ User profile loaded:', user.name);
        
        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('📋 PUT /auth/profile called for user:', req.user.id);
        
        const { name, preferences } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        console.log('✅ User profile updated:', user.name);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user
        });

    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        console.log('📋 POST /auth/change-password called for user:', req.user.id);
        
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Get user with password field
        const user = await User.findById(req.user.id).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        console.log('✅ Password changed for user:', user.name);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Server error changing password'
        });
    }
});
// Test route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes with database are working!',
    endpoints: ['POST /register', 'POST /login']
  });
});

module.exports = router;