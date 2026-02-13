const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  balance: {
    type: Number,
    default: 0
    // Positive = customer owes user, Negative = user owes customer
  }
}, {
  timestamps: true
});

// Compound index for user + customer name uniqueness
customerSchema.index({ user: 1, name: 1 });
customerSchema.index({ user: 1, balance: 1 });

module.exports = mongoose.model('Customer', customerSchema);
