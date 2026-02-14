const mongoose = require('mongoose');

const viewerNoteSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  viewerName: {
    type: String,
    required: [true, 'Please add your name'],
    trim: true,
    maxlength: 50
  },
  note: {
    type: String,
    required: [true, 'Please add a note'],
    trim: true,
    maxlength: 300
  }
}, {
  timestamps: true
});

viewerNoteSchema.index({ transaction: 1, createdAt: -1 });
viewerNoteSchema.index({ customer: 1 });

module.exports = mongoose.model('ViewerNote', viewerNoteSchema);
