const express = require('express');
const { updateRole, setRole, deleteRole, showRoles, showAll, roles}= require('../controllers/roleController');
const router = express.Router();
const { isAuthenticated, isCompany, isAdmin } = require('../middleware/auth');



// /api/updateRole
router.put('/update',isAuthenticated, isCompany,isAdmin, updateRole);
router.get('/showAll',isAuthenticated, isCompany,isAdmin, showAll)
router.get('/show',isAuthenticated, isCompany,isAdmin, showRoles)
router.get('/showR',isAuthenticated, isCompany,isAdmin, roles)
// router.post('/set',isAuthenticated, isCompany,isAdmin, setRole);
// router.delete('/delete',isAuthenticated, isCompany,isAdmin, deleteRole);





module.exports= router;