const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user._id });

    let totalToReceive = 0;
    let totalToPay = 0;

    customers.forEach(c => {
      if (c.balance > 0) {
        totalToReceive += c.balance;
      } else if (c.balance < 0) {
        totalToPay += Math.abs(c.balance);
      }
    });

    res.json({
      totalCustomers: customers.length,
      totalToReceive,
      totalToPay,
      netBalance: totalToReceive + totalToPay
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get monthly summary
// @route   GET /api/dashboard/monthly
exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('customer', 'name');

    const totalGiven = transactions
      .filter(t => t.type === 'GIVEN')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReceived = transactions
      .filter(t => t.type === 'RECEIVED')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      month: m,
      year: y,
      totalTransactions: transactions.length,
      totalGiven,
      totalReceived,
      net: totalReceived - totalGiven,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
