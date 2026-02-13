const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getShareToken
} = require('../controllers/customerController');

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post([
    body('name').notEmpty().withMessage('Customer name is required')
  ], createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put([
    body('name').notEmpty().withMessage('Customer name is required')
  ], updateCustomer)
  .delete(deleteCustomer);

router.get('/:id/share', getShareToken);

module.exports = router;
