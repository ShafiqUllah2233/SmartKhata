const express = require('express');
const router = express.Router();
const { getPublicKhata } = require('../controllers/publicController');

// Public route - NO authentication required
router.get('/khata/:shareToken', getPublicKhata);

module.exports = router;
