const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  await db.collection('users').updateOne(
    { email: 'shafiqullahkhan2556@gmail.com' },
    { $set: { name: 'Waseem Zahid' } }
  );
  const u = await db.collection('users').findOne({ email: 'shafiqullahkhan2556@gmail.com' });
  console.log('Name updated to:', u.name);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
