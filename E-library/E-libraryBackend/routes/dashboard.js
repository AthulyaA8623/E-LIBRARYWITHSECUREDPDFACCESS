const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');

// Temporary dashboard routes
router.get('/stats', adminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard stats endpoint - to be implemented',
    data: {
      totalBooks: 0,
      totalUsers: 0,
      totalDownloads: 0,
      recentActivity: []
    }
  });
});

module.exports = router;