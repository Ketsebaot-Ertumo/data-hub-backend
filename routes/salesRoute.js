const express = require('express');
const { salesData, deleteSales, showSales, updateSales, exportSalesCSV, exportSalesExcel, printSalesExcel, shareEmailSales, shareWhatsAppSales, importSalesData, sale, sendFileWithTele, bot, shareExcelFile, signIntoTelegram, showPaginatedSales } = require('../controllers/salesController');
const router = express.Router();
const { isAuthenticated, isCompany,  isSales } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'importedFiles/' });
    




router.get('/data', isAuthenticated, isCompany,  isSales, salesData);
router.delete('/delete',isAuthenticated, isCompany, isSales, deleteSales);
router.get('/all',isAuthenticated, isCompany, isSales, showSales);
router.get('/allSales',isAuthenticated, isCompany, isSales, showPaginatedSales);
router.get('/show',isAuthenticated, isCompany, isSales, sale);
router.put('/update',isAuthenticated, isCompany, isSales, updateSales);
router.get('/exportCSV',isAuthenticated, isCompany, isSales, exportSalesCSV);
router.get('/exportExcel',isAuthenticated, isCompany, isSales, exportSalesExcel);
router.get('/print',isAuthenticated, isCompany, isSales, printSalesExcel);
router.post('/shareEmail',isAuthenticated, isCompany, isSales, shareEmailSales);
router.post('/import', upload.single('file'),isAuthenticated, isCompany, isSales, importSalesData);


module.exports= router;
