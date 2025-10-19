const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
console.log('🔗 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elibrary')
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Import Routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const readingListRoutes = require('./routes/reading-list');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reading-list', readingListRoutes); // Reading list routes

console.log('✅ Auth routes registered at /api/auth');
console.log('✅ Books routes registered at /api/books');
console.log('✅ User routes registered at /api/users');
console.log('✅ Reading list routes registered at /api/reading-list');

// ===== BASIC ROUTES =====

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test Endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Debug Database Status
app.get('/api/debug/db-status', async (req, res) => {
  try {
    const Book = require('./models/Book');
    const User = require('./models/User');
    
    const bookCount = await Book.countDocuments();
    const userCount = await User.countDocuments();
    const databaseName = mongoose.connection.name;
    
    res.json({
      database: databaseName,
      connected: mongoose.connection.readyState === 1,
      bookCount: bookCount,
      userCount: userCount,
      mongooseState: mongoose.connection.readyState,
      message: `Database: ${databaseName}, Books: ${bookCount}, Users: ${userCount}`
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      connected: false
    });
  }
});

// Debug Users
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({});
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to E-Library API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      books: '/api/books', 
      users: '/api/users',
      debug: '/api/debug/db-status',
      test: '/api/test'
    },
    readingListEndpoints: {
      get: 'GET /api/users/reading-list',
      add: 'POST /api/users/reading-list',
      remove: 'DELETE /api/users/reading-list/:bookId',
      update: 'PUT /api/users/reading-list/:bookId',
      favorite: 'POST /api/users/reading-list/:bookId/favorite'
    },
    timestamp: new Date().toISOString(),
    status: 'Server is running successfully'
  });
});

// Static files - Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/auth',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/books',
      'POST /api/books',
      'GET /api/users',
      'GET /api/users/reading-list',
      'POST /api/users/reading-list',
      'GET /api/debug/db-status',
      'GET /api/debug/users',
      'GET /api/test'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 E-Library API: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`📖 Books routes: http://localhost:${PORT}/api/books`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📚 Reading list: http://localhost:${PORT}/api/users/reading-list`);
  console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/db-status`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
});



























// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const path = require('path');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware - FIXED: Add body parsing for FormData
// app.use(cors());
// app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
// app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For FormData

// // MongoDB Connection
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elibrary';

// console.log('🔗 Connecting to MongoDB...');
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     console.log('✅ Connected to MongoDB');
//   })
//   .catch((error) => {
//     console.error('❌ MongoDB connection error:', error);
//   });

// // Import Models
// const Book = require('./models/Book');
// const User = require('./models/User');

// // Import Routes - FIXED: Add books routes
// const authRoutes = require('./routes/auth');
// const booksRoutes = require('./routes/books'); // ADD THIS LINE

// // Use Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/books', booksRoutes); // ADD THIS LINE - This is crucial!

// console.log('✅ Auth routes registered at /api/auth');
// console.log('✅ Books routes registered at /api/books'); // ADD THIS

// // ===== ROUTES =====

// // 1. Health Check
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     message: 'Server is running!',
//     timestamp: new Date().toISOString(),
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//   });
// });

// // 2. Test Endpoint
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Test endpoint working!' });
// });

// // 3. GET ALL BOOKS - This endpoint is now handled by booksRoutes
// // Remove the duplicate GET /api/books route since it's in booksRoutes

// // 4. USERS ROUTES
// app.get('/api/users', async (req, res) => {
//   try {
//     console.log('👥 Fetching users from database...');
//     const users = await User.find({});
//     console.log(`✅ Found ${users.length} users`);
    
//     res.json({
//       success: true,
//       data: users,
//       count: users.length
//     });
//   } catch (error) {
//     console.error('❌ Error fetching users:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching users',
//       error: error.message
//     });
//   }
// });

// app.get('/api/users/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }
//     res.json({
//       success: true,
//       data: user
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching user',
//       error: error.message
//     });
//   }
// });

// // 5. Debug Database Status
// app.get('/api/debug/db-status', async (req, res) => {
//   try {
//     const bookCount = await Book.countDocuments();
//     const userCount = await User.countDocuments();
//     const databaseName = mongoose.connection.name;
    
//     res.json({
//       database: databaseName,
//       connected: mongoose.connection.readyState === 1,
//       bookCount: bookCount,
//       userCount: userCount,
//       mongooseState: mongoose.connection.readyState,
//       message: `Database: ${databaseName}, Books: ${bookCount}, Users: ${userCount}`
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//       connected: false
//     });
//   }
// });

// // 6. Debug Users
// app.get('/api/debug/users', async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.json({
//       success: true,
//       count: users.length,
//       users: users
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// });

// // 7. REMOVE THIS DUPLICATE ROUTE - It conflicts with booksRoutes
// // app.post('/api/books', async (req, res) => {
// //   // This conflicts with the booksRoutes POST endpoint
// // });

// // 8. Root endpoint
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Welcome to E-Library API',
//     endpoints: {
//       health: '/api/health',
//       auth: '/api/auth',
//       books: '/api/books', 
//       users: '/api/users',
//       debug: '/api/debug/db-status',
//       test: '/api/test'
//     },
//     authEndpoints: {
//       register: 'POST /api/auth/register',
//       login: 'POST /api/auth/login',
//       profile: 'GET /api/auth/profile'
//     }
//   });
// });

// // Static files - Serve uploaded files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Handle 404 errors
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.originalUrl}`,
//     availableEndpoints: [
//       'GET /api/health',
//       'GET /api/auth',
//       'POST /api/auth/register',
//       'POST /api/auth/login',
//       'GET /api/auth/profile',
//       'GET /api/books',
//       'POST /api/books', // File upload route
//       'GET /api/users',
//       'GET /api/debug/db-status',
//       'GET /api/debug/users',
//       'GET /api/test'
//     ]
//   });
// });


// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📚 E-Library API: http://localhost:${PORT}`);
//   console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
//   console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
//   console.log(`📖 Books routes: http://localhost:${PORT}/api/books`);
//   console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
//   console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/db-status`);
//   console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
// });





