const express = require('express');
const router = express.Router();
const { isAuthenticated, isCompany,  isOrgan } = require('../middleware/auth');
const multer = require('multer');
const { organizationData, deleteOrgan, showOrganization, organization, updateOrgan, exportOrganCSV, exportOrganExcel, printOrganExcel, shareEmailOrgan, shareWhatsAppOrgan, importOrganData } = require('../controllers/organizationController');
const upload = multer({ dest: 'importedFiles/' });
    




router.get('/data',isAuthenticated, isCompany, isOrgan, organizationData);
router.delete('/delete',isAuthenticated, isCompany, isOrgan, deleteOrgan);
router.get('/all',isAuthenticated, isCompany, isOrgan, showOrganization);
router.get('/show',isAuthenticated, isCompany, isOrgan, organization);
router.put('/update',isAuthenticated, isCompany, isOrgan, updateOrgan);
router.get('/exportCSV',isAuthenticated, isCompany, isOrgan, exportOrganCSV);
router.get('/exportExcel',isAuthenticated, isCompany, isOrgan, exportOrganExcel);
router.get('/print',isAuthenticated, isCompany, isOrgan, printOrganExcel);
router.post('/shareEmail',isAuthenticated, isCompany, isOrgan, shareEmailOrgan);
router.post('/import', upload.single('file'),isAuthenticated, isCompany, isOrgan, importOrganData);


module.exports= router;