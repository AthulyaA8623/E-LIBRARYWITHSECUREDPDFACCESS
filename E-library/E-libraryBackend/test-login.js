const mongoose = require('mongoose');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = require('./models/User');
    
    // Find the user
    const user = await User.findOne({ email: 'admin@elibrary.com' }).select('+password');
    console.log('👤 Found user:', user ? user.email : 'NOT FOUND');
    
    if (user) {
      console.log('🔑 Stored password hash:', user.password);
      
      // Test password comparison
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare('Admin123!', user.password);
      console.log('🔐 Password match result:', isMatch);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

testLogin();