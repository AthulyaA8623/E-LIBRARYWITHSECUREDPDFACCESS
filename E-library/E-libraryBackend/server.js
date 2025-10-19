// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== MONGODB CONNECTION =====
console.log('🔗 Connecting to MongoDB...');

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1); // Stop the server
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Stop the server if connection fails
});

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const readingListRoutes = require('./routes/reading-list');

// ===== USE ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reading-list', readingListRoutes);

// ===== LOG ROUTES =====
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
      bookCount,
      userCount,
      message: `Database: ${databaseName}, Books: ${bookCount}, Users: ${userCount}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message, connected: false });
  }
});

// Debug Users
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({});
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// Static files - Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 Handler
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

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 E-Library API: http://localhost:${PORT}`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
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
// const path = require('path');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;


// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // MongoDB Connection
// console.log('🔗 Connecting to MongoDB...');
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elibrary')
//     .then(() => console.log('✅ MongoDB connected successfully'))
//     .catch(err => console.error('MongoDB connection error:', err));

// // Import Routes
// const authRoutes = require('./routes/auth');
// const booksRoutes = require('./routes/books');
// const userRoutes = require('./routes/users');
// const readingListRoutes = require('./routes/reading-list');

// // Use Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/books', booksRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/reading-list', readingListRoutes); // Reading list routes

// console.log('✅ Auth routes registered at /api/auth');
// console.log('✅ Books routes registered at /api/books');
// console.log('✅ User routes registered at /api/users');
// console.log('✅ Reading list routes registered at /api/reading-list');

// // ===== BASIC ROUTES =====

// // Health Check
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     message: 'Server is running!',
//     timestamp: new Date().toISOString(),
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//   });
// });

// // Test Endpoint
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Test endpoint working!' });
// });

// // Debug Database Status
// app.get('/api/debug/db-status', async (req, res) => {
//   try {
//     const Book = require('./models/Book');
//     const User = require('./models/User');
    
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

// // Debug Users
// app.get('/api/debug/users', async (req, res) => {
//   try {
//     const User = require('./models/User');
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

// // Root endpoint
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
//     readingListEndpoints: {
//       get: 'GET /api/users/reading-list',
//       add: 'POST /api/users/reading-list',
//       remove: 'DELETE /api/users/reading-list/:bookId',
//       update: 'PUT /api/users/reading-list/:bookId',
//       favorite: 'POST /api/users/reading-list/:bookId/favorite'
//     },
//     timestamp: new Date().toISOString(),
//     status: 'Server is running successfully'
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
//       'POST /api/books',
//       'GET /api/users',
//       'GET /api/users/reading-list',
//       'POST /api/users/reading-list',
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
//   console.log(`📚 Reading list: http://localhost:${PORT}/api/users/reading-list`);
//   console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/db-status`);
//   console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
// });




















