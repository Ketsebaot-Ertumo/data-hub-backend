const express = require('express');
const { BranchData, deleteBranch, exportBranchDataCSV, exportBranchDataExcel, printBranchDataPDF, shareEmailBranch, showBranchProfile, showBranchs, updateBranchProfile, importBranchData, shareWhatsAppBranch } = require('../controllers/branchController');
const router = express.Router();
const { isAuthenticated, isCompany,  isBranch } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'importedFiles/' });
    





router.get('/data',isAuthenticated, isCompany, isBranch, BranchData);
router.delete('/delete',isAuthenticated, isCompany, isBranch, deleteBranch);
router.get('/show',isAuthenticated, isCompany, isBranch, showBranchProfile);
router.get('/all',isAuthenticated, isCompany, isBranch, showBranchs);
router.put('/update',isAuthenticated, isCompany, isBranch, updateBranchProfile);
router.get('/exportCSV',isAuthenticated, isCompany, isBranch, exportBranchDataCSV);
router.get('/exportExcel',isAuthenticated, isCompany, isBranch, exportBranchDataExcel);
router.get('/print',isAuthenticated, isCompany, isBranch, printBranchDataPDF);
router.post('/shareEmail',isAuthenticated, isCompany, isBranch, shareEmailBranch);
router.post('/import', upload.single('file'),isAuthenticated, isCompany, isBranch, importBranchData);


module.exports= router;