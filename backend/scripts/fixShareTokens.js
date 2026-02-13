require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  const col = mongoose.connection.db.collection('customers');
  
  // Find all customers without shareToken
  const customers = await col.find({}).toArray();
  
  for (const c of customers) {
    const token = crypto.randomBytes(8).toString('hex');
    await col.updateOne(
      { _id: c._id },
      { $set: { shareToken: token } }
    );
    console.log(`Updated ${c.name} -> shareToken: ${token}`);
  }
  
  // Verify
  const updated = await col.find({}).toArray();
  for (const c of updated) {
    console.log(`Verified: ${c.name} -> ${c.shareToken}`);
  }
  
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
