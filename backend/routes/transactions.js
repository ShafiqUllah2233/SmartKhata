const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  addSharedExpense,
  replyToNote
} = require('../controllers/transactionController');

router.use(protect);

// Shared expense route (must be before /:id to avoid conflict)
router.route('/shared-expense')
  .post([
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
  ], addSharedExpense);

// Routes under /api/customers/:customerId/transactions
router.route('/')
  .get(getTransactions)
  .post([
    body('type').isIn(['GIVEN', 'RECEIVED']).withMessage('Type must be GIVEN or RECEIVED'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
  ], addTransaction);

// Reply to a viewer note
router.route('/notes/:noteId/reply')
  .put([
    body('reply').trim().isLength({ min: 1, max: 300 }).withMessage('Reply must be 1-300 characters')
  ], replyToNote);

// Route for deleting: /api/transactions/:id
router.route('/:id')
  .delete(deleteTransaction);

module.exports = router;
