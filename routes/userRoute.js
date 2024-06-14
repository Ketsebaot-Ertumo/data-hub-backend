const express = require('express');
const { showProfile, showUsers, updateUserProfile,
    deleteUser, exportDataCSV, exportDataExcel, printDataPDF, shareEmail, shareWhatsApp } = require('../controllers/userController');
const router = express.Router();
const { isAuthenticated, isCompany, isUser } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
    
    


     
router.get('/show',isAuthenticated, isCompany,isUser, showProfile);
router.get('/all',isAuthenticated, isCompany, isUser, showUsers);
router.get('/all/token?:token',isAuthenticated, isCompany, isUser, showUsers);
router.put('/update', isAuthenticated, isCompany, updateUserProfile);
router.delete('/delete',isAuthenticated, isCompany, isUser, deleteUser)
router.get('/exportCSV',isAuthenticated, isCompany, isUser, exportDataCSV);
router.get('/exportExcel', isAuthenticated, isCompany, isUser, exportDataExcel);
router.get('/print',isAuthenticated, isCompany, isUser, printDataPDF);
router.post('/shareEmail', isAuthenticated, isCompany, isUser, shareEmail)



module.exports= router;

