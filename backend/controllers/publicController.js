const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

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
