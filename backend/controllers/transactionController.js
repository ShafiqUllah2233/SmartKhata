const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const ViewerNote = require('../models/ViewerNote');

// @desc    Add transaction (GIVEN or RECEIVED)
// @route   POST /api/customers/:customerId/transactions
exports.addTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount, description, date } = req.body;
    const customerId = req.params.customerId;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Calculate new balance
    let newBalance = customer.balance;
    if (type === 'GIVEN') {
      newBalance += amount; // Customer owes more
    } else if (type === 'RECEIVED') {
      newBalance -= amount; // Customer owes less
    }

    const transaction = await Transaction.create({
      customer: customerId,
      user: req.user._id,
      type,
      amount,
      description: description || '',
      date: date || Date.now(),
      balanceAfter: newBalance
    });

    // Update customer balance
    customer.balance = newBalance;
    await customer.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all transactions for a customer
// @route   GET /api/customers/:customerId/transactions
exports.getTransactions = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { startDate, endDate, type } = req.query;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let query = { customer: customerId, user: req.user._id };

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Filter by type
    if (type && ['GIVEN', 'RECEIVED'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

    // Fetch viewer notes for these transactions
    const txIds = transactions.map(t => t._id);
    const notes = await ViewerNote.find({ transaction: { $in: txIds } }).sort({ createdAt: -1 });

    // Group notes by transaction ID
    const notesByTx = {};
    notes.forEach(n => {
      const key = n.transaction.toString();
      if (!notesByTx[key]) notesByTx[key] = [];
      notesByTx[key].push(n);
    });

    // Attach notes to transactions
    const transactionsWithNotes = transactions.map(t => {
      const obj = t.toObject();
      obj.viewerNotes = notesByTx[t._id.toString()] || [];
      return obj;
    });

    res.json({
      customer,
      transactions: transactionsWithNotes,
      summary: {
        totalGiven: transactions
          .filter(t => t.type === 'GIVEN')
          .reduce((sum, t) => sum + t.amount, 0),
        totalReceived: transactions
          .filter(t => t.type === 'RECEIVED')
          .reduce((sum, t) => sum + t.amount, 0),
        balance: customer.balance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add shared expense divided among all members
// @route   POST /api/transactions/shared-expense
exports.addSharedExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description, customerIds, includeAdmin } = req.body;

    // Get customers - either selected ones or all
    let customers;
    if (customerIds && Array.isArray(customerIds) && customerIds.length > 0) {
      customers = await Customer.find({ user: req.user._id, _id: { $in: customerIds } });
    } else {
      customers = await Customer.find({ user: req.user._id });
    }

    if (customers.length === 0) {
      return res.status(400).json({ message: 'No customers found. Add customers first.' });
    }

    // Divide by (selected customers + admin if included)
    const adminIncluded = includeAdmin !== false; // default true for backward compatibility
    const totalMembers = customers.length + (adminIncluded ? 1 : 0);
    const perPerson = Math.round((amount / totalMembers) * 100) / 100; // Round to 2 decimals

    const transactions = [];
    const expDesc = description ? `Shared: ${description}` : `Shared expense (${totalMembers} members)`;

    for (const customer of customers) {
      const newBalance = customer.balance + perPerson; // GIVEN increases balance (customer owes more)

      const transaction = await Transaction.create({
        customer: customer._id,
        user: req.user._id,
        type: 'GIVEN',
        amount: perPerson,
        description: expDesc,
        date: Date.now(),
        balanceAfter: newBalance
      });

      customer.balance = newBalance;
      await customer.save();

      transactions.push({
        customer: customer.name,
        amount: perPerson,
        newBalance
      });
    }

    res.status(201).json({
      message: `Rs. ${amount} divided among ${totalMembers} members (Rs. ${perPerson} each)${adminIncluded ? '' : ' (admin excluded)'}`,
      totalAmount: amount,
      totalMembers,
      perPerson,
      adminShare: adminIncluded ? perPerson : 0,
      adminIncluded,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const customer = await Customer.findById(transaction.customer);

    // Reverse the balance effect
    if (transaction.type === 'GIVEN') {
      customer.balance -= transaction.amount;
    } else {
      customer.balance += transaction.amount;
    }
    await customer.save();

    // Recalculate balanceAfter for all subsequent transactions
    const subsequentTransactions = await Transaction.find({
      customer: transaction.customer,
      date: { $gte: transaction.date },
      _id: { $ne: transaction._id }
    }).sort({ date: 1, createdAt: 1 });

    let runningBalance = customer.balance;
    // Re-fetch all transactions before deleted one to get correct running balance
    const priorTransactions = await Transaction.find({
      customer: transaction.customer,
      $or: [
        { date: { $lt: transaction.date } },
        { date: transaction.date, createdAt: { $lt: transaction.createdAt } }
      ]
    }).sort({ date: 1, createdAt: 1 });

    if (priorTransactions.length > 0) {
      runningBalance = priorTransactions[priorTransactions.length - 1].balanceAfter;
    } else {
      runningBalance = 0;
    }

    // Adjust running balance by removing deleted transaction's effect
    for (const t of subsequentTransactions) {
      if (t.type === 'GIVEN') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      t.balanceAfter = runningBalance;
      await t.save();
    }

    await Transaction.deleteOne({ _id: transaction._id });

    res.json({ message: 'Transaction deleted', newBalance: customer.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Edit a transaction (amount, description, type, date)
// @route   PUT /api/transactions/:id
exports.editTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const customer = await Customer.findById(transaction.customer);
    const { amount, description, type, date } = req.body;

    // Reverse old transaction effect on customer balance
    if (transaction.type === 'GIVEN') {
      customer.balance -= transaction.amount;
    } else {
      customer.balance += transaction.amount;
    }

    // Update transaction fields
    const newType = type || transaction.type;
    const newAmount = amount !== undefined ? parseFloat(amount) : transaction.amount;
    transaction.type = newType;
    transaction.amount = newAmount;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);

    // Apply new transaction effect
    if (newType === 'GIVEN') {
      customer.balance += newAmount;
    } else {
      customer.balance -= newAmount;
    }

    await customer.save();

    // Recalculate balanceAfter for this and all subsequent transactions
    const allTransactions = await Transaction.find({
      customer: transaction.customer
    }).sort({ date: 1, createdAt: 1 });

    let runningBalance = 0;
    for (const t of allTransactions) {
      if (t.type === 'GIVEN') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      if (t._id.toString() === transaction._id.toString()) {
        transaction.balanceAfter = runningBalance;
      } else {
        t.balanceAfter = runningBalance;
        await t.save();
      }
    }

    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reply to a viewer note
// @route   PUT /api/transactions/notes/:noteId/reply
exports.replyToNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note = await ViewerNote.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Verify the note belongs to a transaction owned by this user
    const transaction = await Transaction.findOne({
      _id: note.transaction,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(403).json({ message: 'Not authorized to reply to this note' });
    }

    note.adminReply = req.body.reply;
    note.adminRepliedAt = new Date();
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
