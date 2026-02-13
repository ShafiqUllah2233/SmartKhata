const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const customerCount = await Customer.countDocuments({ user: user._id });
        const transactionCount = await Transaction.countDocuments({ user: user._id });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          customerCount,
          transactionCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user (admin cannot delete themselves)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete themselves' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all user's transactions and customers
    await Transaction.deleteMany({ user: user._id });
    await Customer.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    res.json({
      totalUsers,
      totalCustomers,
      totalTransactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
