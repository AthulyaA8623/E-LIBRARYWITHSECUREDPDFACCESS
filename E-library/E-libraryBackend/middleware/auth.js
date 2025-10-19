// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Regular auth middleware
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Remove 'Bearer ' prefix if present
        const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Verify token
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'fallback_secret');
        
        // Get user from token
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

// // Admin auth middleware
// const adminAuth = async (req, res, next) => {
//     try {
//         // Get token from header
//         const token = req.header('Authorization');
        
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'No token, authorization denied'
//             });
//         }

//         // Remove 'Bearer ' prefix if present
//         const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;

//         // Verify token
//         const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'fallback_secret');
        
//         // Get user from token
//         const user = await User.findById(decoded.id).select('-password');
        
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Token is not valid'
//             });
//         }

//         // Check if user is admin
//         if (user.role !== 'admin') {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Access denied. Admin only.'
//             });
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         console.error('Admin auth middleware error:', error);
//         res.status(401).json({
//             success: false,
//             message: 'Token is not valid'
//         });
//     }
// };
// middleware/auth.js - Add this if not exists
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = { auth, adminAuth };
// Export both middlewares
module.exports = {
    auth,
    adminAuth
};










// // FIXED: Remove duplicate module.exports
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = async (req, res, next) => {
//   try {
//     // Get token from header
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'No token provided, access denied'
//       });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Get user from token
//     const user = await User.findById(decoded.id);
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Token is invalid - user not found'
//       });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Account has been deactivated'
//       });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('Auth Middleware Error:', error);
    
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid token'
//       });
//     }
    
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Token has expired'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Server error in authentication'
//     });
//   }
// };

// // Admin middleware
// const adminAuth = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Admin access required'
//     });
//   }
//   next();
// };

// // Moderator or Admin middleware
// const moderatorAuth = (req, res, next) => {
//   if (!['admin', 'moderator'].includes(req.user.role)) {
//     return res.status(403).json({
//       success: false,
//       message: 'Moderator or Admin access required'
//     });
//   }
//   next();
// };

// // FIXED: Only export once
// module.exports = { auth, adminAuth, moderatorAuth };
// // REMOVE THIS LINE: module.exports = auth;



