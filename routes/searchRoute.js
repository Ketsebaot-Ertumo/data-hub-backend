const express = require('express');
const router = express.Router();
const { search, searchUser, searchSales, searchCustomer, searchBranch, searchOrganization, searchProduct } = require('../controllers/searchController');
const { isAuthenticated, isCompany, isUser, isSales, isCustomer, isBranch, isOrgan, isProduct } = require('../middleware/auth');


router.get('/global',isAuthenticated, isCompany, search);
router.get('/user',isAuthenticated, isCompany,isUser, searchUser);
router.get('/sales',isAuthenticated, isCompany,isSales, searchSales);
router.get('/customer',isAuthenticated, isCompany,isCustomer, searchCustomer);
router.get('/branch',isAuthenticated, isCompany,isBranch, searchBranch);
router.get('/organ',isAuthenticated, isCompany,isOrgan, searchOrganization);
router.get('/product',isAuthenticated, isCompany,isProduct, searchProduct);


module.exports = router;