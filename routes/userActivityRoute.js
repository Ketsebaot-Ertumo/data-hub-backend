const express = require('express');
const { isAuthenticated, isCompany } = require('../middleware/auth');
const { showUserActivity, show } = require('../controllers/userActivityController');
const router = express.Router();


router.get('/user-activity', isAuthenticated, isCompany, showUserActivity);
router.get('/show', isAuthenticated, isCompany, show);

module.exports= router;