const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateCustomerPDF,
  exportCustomerCSV,
  exportAllCustomersCSV
} = require('../controllers/reportController');

router.use(protect);

router.get('/customer/:customerId/pdf', generateCustomerPDF);
router.get('/customer/:customerId/csv', exportCustomerCSV);
router.get('/all/csv', exportAllCustomersCSV);

module.exports = router;
