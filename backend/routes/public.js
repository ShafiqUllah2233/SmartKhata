const express = require('express');
const router = express.Router();
const { getPublicKhata, getGroupKhata, getGroupCustomerDetail } = require('../controllers/publicController');

// Public routes - NO authentication required
router.get('/khata/:shareToken', getPublicKhata);
router.get('/group/:groupToken', getGroupKhata);
router.get('/group/:groupToken/customer/:shareToken', getGroupCustomerDetail);

module.exports = router;
