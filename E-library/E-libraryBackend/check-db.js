const mongoose = require('mongoose'); 
require('dotenv').config(); 
ECHO is on.
mongoose.connect(process.env.MONGODB_URI).then(async () =
  const User = require('./models/User'); 
  const users = await User.find({}); 
  console.log('USERS IN DATABASE:'); 
  users.forEach(user =
    console.log('- Name:', user.name); 
    console.log('  Email:', user.email); 
    console.log('  Role:', user.role); 
    console.log('  Password exists:', !!user.password); 
    console.log('---'); 
  }); 
  process.exit(); 
}); 
