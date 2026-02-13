require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function backfillShareTokens() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  
  const Customer = require('../models/Customer');
  const customers = await Customer.find({});
  
  console.log(`Found ${customers.length} customers`);
  
  for (const c of customers) {
    if (!c.shareToken) {
      c.shareToken = crypto.randomBytes(8).toString('hex');
      await c.save();
      console.log(`Generated token for ${c.name}: ${c.shareToken}`);
    } else {
      console.log(`Already has token: ${c.name} -> ${c.shareToken}`);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

backfillShareTokens().catch(err => {
  console.error(err);
  process.exit(1);
});
