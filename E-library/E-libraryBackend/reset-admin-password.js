// reset-admin-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elibrary');
    console.log('✅ Connected to MongoDB\n');
    
    // Direct MongoDB operation to avoid model issues
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find the admin user
    const admin = await usersCollection.findOne({ email: 'admin@elibrary.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Found admin user:', admin.email);
    console.log('🔑 Current password (raw):', admin.password);
    
    // Hash the new password properly
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);
    
    // Update with hashed password
    await usersCollection.updateOne(
      { email: 'admin@elibrary.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password hashed and updated');
    console.log('🔐 New password hash:', hashedPassword);
    console.log('🎉 Admin password reset successful!');
    console.log('📧 Email: admin@elibrary.com');
    console.log('🔑 Password: Admin123!');
    
    // Verify the password works
    const updatedAdmin = await usersCollection.findOne({ email: 'admin@elibrary.com' });
    const isMatch = await bcrypt.compare('Admin123!', updatedAdmin.password);
    console.log('🔍 Password verification:', isMatch);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

resetAdminPassword();