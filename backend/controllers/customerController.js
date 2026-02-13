const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

// @desc    Create customer
// @route   POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address } = req.body;

    const customer = await Customer.create({
      user: req.user._id,
      name,
      phone: phone || '',
      address: address || ''
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all customers for user
// @route   GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    const { search, filter, sort } = req.query;

    let query = { user: req.user._id };

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by balance
    if (filter === 'positive') {
      query.balance = { $gt: 0 };
    } else if (filter === 'negative') {
      query.balance = { $lt: 0 };
    } else if (filter === 'settled') {
      query.balance = 0;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'balance-high') sortOption = { balance: -1 };
    if (sort === 'balance-low') sortOption = { balance: 1 };
    if (sort === 'recent') sortOption = { updatedAt: -1 };

    const customers = await Customer.find(query).sort(sortOption);

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, phone, address },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete customer and all transactions
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete all transactions for this customer
    await Transaction.deleteMany({ customer: customer._id });
    await Customer.deleteOne({ _id: customer._id });

    res.json({ message: 'Customer and all transactions deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
