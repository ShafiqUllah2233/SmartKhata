const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updatePassword, updateKhataName } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', protect, getMe);

router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], updatePassword);

router.put('/khata-name', protect, updateKhataName);

module.exports = router;
