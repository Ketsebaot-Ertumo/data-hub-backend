const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createCompany, allCompany, company, editCompany, deleteCompany, importData, exportExcel, exportCSV } = require('../controllers/companyController');
const multer = require('multer');
const upload = multer({ dest: 'importedFiles/' });


// Route for sending notifications
router.post('/create',isAuthenticated,isAdmin, createCompany );
router.get('/all', allCompany );
router.get('/show',isAuthenticated,isAdmin,company );
router.put('/edit',isAuthenticated,isAdmin,editCompany );
router.delete('/delete',isAuthenticated,isAdmin,deleteCompany );
router.get('/exportExcel',isAuthenticated,isAdmin,exportExcel);
router.get('/exportCSV',isAuthenticated,isAdmin,exportCSV);
router.post('/import', upload.single('file'),isAuthenticated, isAdmin, importData);



module.exports = router;