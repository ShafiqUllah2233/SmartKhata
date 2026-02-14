const express = require('express');
const router = express.Router();
const { getPublicKhata, getGroupKhata, getGroupCustomerDetail, addViewerNote } = require('../controllers/publicController');

// Public routes - NO authentication required
router.get('/khata/:shareToken', getPublicKhata);
router.get('/group/:groupToken', getGroupKhata);
router.get('/group/:groupToken/customer/:shareToken', getGroupCustomerDetail);
router.post('/note', addViewerNote);

module.exports = router;
