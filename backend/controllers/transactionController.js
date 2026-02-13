const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

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

    res.json({
      customer,
      transactions,
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
