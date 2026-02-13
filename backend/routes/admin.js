const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getAdminStats } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// All routes require auth + admin
router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/stats', getAdminStats);

module.exports = router;
