const express = require('express');
const router = express.Router();
const { filterUser, filterCustomer, filterSales, filterBranch, filterOrganization, filterProduct } = require('../controllers/filterController');
const { isAuthenticated, isCompany, isUser, isSales, isCustomer, isBranch, isOrgan, isProduct } = require('../middleware/auth');
const { filterTcustomer, filterTproduct } = require('../controllers/filterTitle');


router.get('/user',isAuthenticated, isCompany,isUser, filterUser);
router.get('/sales',isAuthenticated, isCompany,isSales, filterSales);
router.get('/customer',isAuthenticated, isCompany,isCustomer, filterCustomer);
router.get('/branch',isAuthenticated, isCompany,isBranch, filterBranch);
router.get('/organ',isAuthenticated, isCompany,isOrgan, filterOrganization);
router.get('/product',isAuthenticated, isCompany,isProduct, filterProduct);

router.get('/customerT',isAuthenticated,isCustomer, filterTcustomer);
router.get('/productT',isAuthenticated,isProduct, filterTproduct);

module.exports = router;