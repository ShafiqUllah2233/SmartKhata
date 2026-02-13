const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');

  // Find users that don't have a groupShareToken
  const users = await usersCol.find({ $or: [{ groupShareToken: null }, { groupShareToken: { $exists: false } }] }).toArray();
  
  for (const user of users) {
    const token = crypto.randomBytes(10).toString('hex');
    await usersCol.updateOne({ _id: user._id }, { $set: { groupShareToken: token } });
    console.log(`Set groupShareToken for ${user.email}: ${token}`);
  }

  if (users.length === 0) {
    const allUsers = await usersCol.find({}).toArray();
    for (const u of allUsers) {
      console.log(`${u.email}: groupShareToken = ${u.groupShareToken}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => { console.error(err); process.exit(1); });
