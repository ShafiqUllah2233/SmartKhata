// Run this script once to set existing user as admin
// Usage: node scripts/setAdmin.js shafiq@gmail.com

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const setAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = process.argv[2] || process.env.ADMIN_EMAIL;
    if (!email) {
      console.log('Usage: node scripts/setAdmin.js <email>');
      process.exit(1);
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`✅ ${user.name} (${user.email}) is now admin`);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

setAdmin();
