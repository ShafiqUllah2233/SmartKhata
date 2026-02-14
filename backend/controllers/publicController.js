const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get public khata by share token (NO LOGIN REQUIRED)
// @route   GET /api/public/khata/:shareToken
exports.getPublicKhata = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const customer = await Customer.findOne({ shareToken }).select('name phone balance createdAt');

    if (!customer) {
      return res.status(404).json({ message: 'Khata not found' });
    }

    // Get all transactions for this customer
    const { startDate, endDate, type } = req.query;
    let query = { customer: customer._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (type && ['GIVEN', 'RECEIVED'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .select('type amount description date balanceAfter')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      customer: {
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
        memberSince: customer.createdAt
      },
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

// @desc    Get ALL customers khata by group share token (NO LOGIN REQUIRED)
// @route   GET /api/public/group/:groupToken
exports.getGroupKhata = async (req, res) => {
  try {
    const { groupToken } = req.params;

    // Find the user by groupShareToken
    const user = await User.findOne({ groupShareToken: groupToken });
    if (!user) {
      return res.status(404).json({ message: 'Khata not found' });
    }

    // Get all customers for this user
    const customers = await Customer.find({ user: user._id })
      .select('name phone balance shareToken createdAt updatedAt')
      .sort({ updatedAt: -1 });

    // Calculate totals
    const totalOwed = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
    const totalOwing = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);

    // Calculate monthly total expense (all RECEIVED transactions this month across all customers)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const customerIds = customers.map(c => c._id);
    const monthlyReceivedTxns = await Transaction.find({
      customer: { $in: customerIds },
      type: 'RECEIVED',
      date: { $gte: monthStart, $lte: monthEnd }
    }).select('amount');
    const monthlyTotalExpense = monthlyReceivedTxns.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      ownerName: user.name,
      customers: customers.map(c => ({
        name: c.name,
        phone: c.phone,
        balance: c.balance,
        shareToken: c.shareToken,
        updatedAt: c.updatedAt
      })),
      summary: {
        totalCustomers: customers.length,
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing,
        monthlyTotalExpense,
        currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single customer detail from group view (NO LOGIN REQUIRED)
// @route   GET /api/public/group/:groupToken/customer/:shareToken
exports.getGroupCustomerDetail = async (req, res) => {
  try {
    const { groupToken, shareToken } = req.params;

    // Verify group token
    const user = await User.findOne({ groupShareToken: groupToken });
    if (!user) {
      return res.status(404).json({ message: 'Khata not found' });
    }

    // Find customer
    const customer = await Customer.findOne({ shareToken, user: user._id })
      .select('name phone balance createdAt');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get transactions
    const { startDate, endDate, type } = req.query;
    let query = { customer: customer._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (type && ['GIVEN', 'RECEIVED'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .select('type amount description date balanceAfter')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      customer: {
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
        memberSince: customer.createdAt
      },
      transactions,
      summary: {
        totalGiven: transactions.filter(t => t.type === 'GIVEN').reduce((sum, t) => sum + t.amount, 0),
        totalReceived: transactions.filter(t => t.type === 'RECEIVED').reduce((sum, t) => sum + t.amount, 0),
        balance: customer.balance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
