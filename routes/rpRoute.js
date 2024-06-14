const express = require('express');
const { rolePermission, createRP }= require('../controllers/rpController');
const router = express.Router();
const { isAuthenticated, isCompany, isAdmin } = require('../middleware/auth');



// set permissions to role
router.post('/set',isAuthenticated, isCompany, isAdmin, rolePermission);

module.exports= router;