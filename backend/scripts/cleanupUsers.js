require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  const Customer = require('../models/Customer');
  const Transaction = require('../models/Transaction');

  const keepEmail = 'shafiqullahkhan2556@gmail.com';

  // 1. Make this user admin
  await User.updateOne({ email: keepEmail }, { role: 'admin' });
  console.log(`Made ${keepEmail} -> admin`);

  // 2. Get IDs of users to delete
  const usersToDelete = await User.find({ email: { $ne: keepEmail } });
  console.log(`Deleting ${usersToDelete.length} other users:`);
  usersToDelete.forEach(u => console.log(`  - ${u.name} (${u.email})`));

  const deleteUserIds = usersToDelete.map(u => u._id);

  // 3. Delete their customers and transactions
  const customersToDelete = await Customer.find({ user: { $in: deleteUserIds } });
  console.log(`Deleting ${customersToDelete.length} customers from other users`);

  const customerIds = customersToDelete.map(c => c._id);
  const txResult = await Transaction.deleteMany({ customer: { $in: customerIds } });
  console.log(`Deleted ${txResult.deletedCount} transactions`);

  const custResult = await Customer.deleteMany({ user: { $in: deleteUserIds } });
  console.log(`Deleted ${custResult.deletedCount} customers`);

  // 4. Delete the users
  const userResult = await User.deleteMany({ email: { $ne: keepEmail } });
  console.log(`Deleted ${userResult.deletedCount} users`);

  // 5. Transfer existing customers (from old shafiqoo627 user) to new admin
  const keeper = await User.findOne({ email: keepEmail });
  const orphanCustomers = await Customer.find({});
  console.log(`\nRemaining customers: ${orphanCustomers.length}`);
  orphanCustomers.forEach(c => console.log(`  ${c.name} -> shareToken: ${c.shareToken}`));

  console.log(`\nDone! Only ${keepEmail} remains as admin.`);
  process.exit(0);
}

cleanup().catch(err => { console.error(err); process.exit(1); });
