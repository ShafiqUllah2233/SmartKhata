const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboard, getMonthlySummary } = require('../controllers/dashboardController');

router.use(protect);

router.get('/', getDashboard);
router.get('/monthly', getMonthlySummary);

module.exports = router;
