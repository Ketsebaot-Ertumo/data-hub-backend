const express = require('express');
const router = express.Router();
const multer = require('multer');
const { customerData, deleteCustomer, showCustomers, deleteDependent, customer, showDependents, updateDependent, updateCustomer, exportCustomerCSV, exportCustomerExcel, shareEmailCustomer, importCustomerData, printCustomerExcel, showCreditCustomers, showCashCustomers, dependent } = require('../controllers/customerController');
const { isAuthenticated, isCompany,  isCustomer} = require('../middleware/auth');

const upload = multer({ dest: 'importedFiles/' });

router.get('/data',isAuthenticated, isCompany, isCustomer, customerData);
router.delete('/deleteCustomer',isAuthenticated, isCompany, isCustomer, deleteCustomer);
router.delete('/deleteDependent',isAuthenticated, isCompany, isCustomer, deleteDependent);
router.get('/show',isAuthenticated, isCompany, isCustomer, customer);
router.get('/showDep',isAuthenticated, isCompany, isCustomer, dependent);
router.get('/allCustomers',isAuthenticated, isCompany, isCustomer, showCustomers);
router.get('/allDependents',isAuthenticated, isCompany, isCustomer, showDependents);
router.put('/updateCustomer',isAuthenticated, isCompany, isCustomer, updateCustomer);
router.put('/updateDependent',isAuthenticated, isCompany, isCustomer, updateDependent);
router.get('/exportCSV',isAuthenticated, isCompany, isCustomer, exportCustomerCSV);
router.get('/exportExcel',isAuthenticated, isCompany, isCustomer, exportCustomerExcel);
router.get('/print',isAuthenticated, isCompany, isCustomer, printCustomerExcel);
router.post('/shareEmail',isAuthenticated, isCompany, isCustomer, shareEmailCustomer);
router.post('/import', upload.single('file'),isAuthenticated, isCompany, isCustomer, importCustomerData);
router.get('/showCredit',isAuthenticated, isCompany,isCustomer, showCreditCustomers);
router.get('/showCash',isAuthenticated, isCompany,isCustomer, showCashCustomers)


module.exports= router;

