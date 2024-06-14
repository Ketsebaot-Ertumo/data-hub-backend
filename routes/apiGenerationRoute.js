const express = require('express');
const { generateTokenForRole } = require('../controllers/apiGenerateController');
const { isAuthenticated, isCompany, isAdmin } = require('../middleware/auth');
const router = express.Router();


router.post('/generate-token',isAuthenticated, isAdmin, generateTokenForRole);

module.exports = router;