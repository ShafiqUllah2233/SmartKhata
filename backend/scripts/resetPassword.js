require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  
  const email = 'shafiqullahkhan033@gmail.com';
  const newPassword = 'i221355@nu.edu.pk';
  
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);
  
  const result = await User.updateOne(
    { email },
    { $set: { password: hashed } }
  );
  
  console.log(`Password reset for ${email}:`, result.modifiedCount ? 'SUCCESS' : 'FAILED');
  process.exit(0);
}

resetPassword().catch(err => { console.error(err); process.exit(1); });
