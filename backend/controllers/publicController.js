const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ViewerNote = require('../models/ViewerNote');

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

    // Get viewer notes for these transactions
    const transactionIds = transactions.map(t => t._id);
    const notes = await ViewerNote.find({ transaction: { $in: transactionIds } })
      .select('transaction viewerName note createdAt')
      .sort({ createdAt: -1 });

    // Group notes by transaction ID
    const notesByTransaction = {};
    notes.forEach(n => {
      const tid = n.transaction.toString();
      if (!notesByTransaction[tid]) notesByTransaction[tid] = [];
      notesByTransaction[tid].push({
        _id: n._id,
        viewerName: n.viewerName,
        note: n.note,
        createdAt: n.createdAt
      });
    });

    res.json({
      customer: {
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
        memberSince: customer.createdAt
      },
      transactions: transactions.map(t => ({
        ...t.toObject(),
        viewerNotes: notesByTransaction[t._id.toString()] || []
      })),
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

// @desc    Add a viewer note to a transaction (NO LOGIN REQUIRED)
// @route   POST /api/public/note
exports.addViewerNote = async (req, res) => {
  try {
    const { transactionId, shareToken, viewerName, note } = req.body;

    if (!transactionId || !shareToken || !viewerName || !note) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (viewerName.length > 50) {
      return res.status(400).json({ message: 'Name must be 50 characters or less' });
    }

    if (note.length > 300) {
      return res.status(400).json({ message: 'Note must be 300 characters or less' });
    }

    // Verify the customer exists with this shareToken
    const customer = await Customer.findOne({ shareToken });
    if (!customer) {
      return res.status(404).json({ message: 'Khata not found' });
    }

    // Verify the transaction belongs to this customer
    const transaction = await Transaction.findOne({ _id: transactionId, customer: customer._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check rate limit: max 10 notes per customer per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const notesToday = await ViewerNote.countDocuments({
      customer: customer._id,
      createdAt: { $gte: todayStart }
    });
    if (notesToday >= 10) {
      return res.status(429).json({ message: 'Daily note limit reached (max 10 per day)' });
    }

    const viewerNote = await ViewerNote.create({
      transaction: transactionId,
      customer: customer._id,
      viewerName: viewerName.trim(),
      note: note.trim()
    });

    res.status(201).json({
      _id: viewerNote._id,
      viewerName: viewerNote.viewerName,
      note: viewerNote.note,
      createdAt: viewerNote.createdAt
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
      khataName: user.khataName || (user.name + "'s Khata"),
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

    // Get viewer notes for these transactions
    const transactionIds = transactions.map(t => t._id);
    const notes = await ViewerNote.find({ transaction: { $in: transactionIds } })
      .select('transaction viewerName note createdAt')
      .sort({ createdAt: -1 });

    const notesByTransaction = {};
    notes.forEach(n => {
      const tid = n.transaction.toString();
      if (!notesByTransaction[tid]) notesByTransaction[tid] = [];
      notesByTransaction[tid].push({
        _id: n._id,
        viewerName: n.viewerName,
        note: n.note,
        createdAt: n.createdAt
      });
    });

    res.json({
      customer: {
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance,
        memberSince: customer.createdAt
      },
      transactions: transactions.map(t => ({
        ...t.toObject(),
        viewerNotes: notesByTransaction[t._id.toString()] || []
      })),
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
