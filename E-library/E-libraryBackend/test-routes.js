// test-routes.js - Run this to check your current routes
const express = require('express');
const app = express();

// Add this to your main app.js file temporarily
app.get('/api/debug/routes', (req, res) => {
    const routes = [
        { method: 'GET', path: '/api/books' },
        { method: 'POST', path: '/api/books' },
        { method: 'GET', path: '/api/books/:id' },
        { method: 'PUT', path: '/api/books/:id' },
        { method: 'DELETE', path: '/api/books/:id' }
    ];
    
    res.json({
        message: 'Available book routes should be:',
        expectedRoutes: routes,
        actualRoutes: 'Check your routes/books.js file'
    });
});

console.log('🔍 Test this endpoint: http://localhost:5000/api/debug/routes');