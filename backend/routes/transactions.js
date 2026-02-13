const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  addTransaction,
  getTransactions,
  deleteTransaction
} = require('../controllers/transactionController');

router.use(protect);

// Routes under /api/customers/:customerId/transactions
router.route('/')
  .get(getTransactions)
  .post([
    body('type').isIn(['GIVEN', 'RECEIVED']).withMessage('Type must be GIVEN or RECEIVED'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
  ], addTransaction);

// Route for deleting: /api/transactions/:id
router.route('/:id')
  .delete(deleteTransaction);

module.exports = router;
