const express = require('express');
const { signup, signin, logout, confirmEmail, forgotPassword, resetPassword, sendSMS, confirmSMS } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// authentication
router.post('/signup', signup);
router.post('/confirm', confirmEmail)
router.post('/signin', signin);
router.get('/logout', logout);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

// router.post('/send-sms',isAuthenticated, sendSMS);
router.post('/confirmSms',isAuthenticated, confirmSMS)

module.exports = router;