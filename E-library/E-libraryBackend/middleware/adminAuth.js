// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

module.exports = adminAuth;