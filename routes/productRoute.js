const express = require('express');
const router = express.Router();
const { isAuthenticated, isCompany,  isProduct } = require('../middleware/auth');
const multer = require('multer');
const { productData, deleteProduct, showProducts, product, updateProduct, exportProductCSV, exportProductExcel, printProductExcel, shareEmailProduct, importProductData, shareWhatsAppProduct } = require('../controllers/productController');
const upload = multer({ dest: 'importedFiles/' });
    




router.get('/data',isAuthenticated, isCompany, isProduct, productData);
router.delete('/delete',isAuthenticated, isCompany, isProduct, deleteProduct);
router.get('/all',isAuthenticated, isCompany, isProduct, showProducts);
router.get('/show',isAuthenticated, isCompany, isProduct, product);
router.put('/update',isAuthenticated, isCompany, isProduct, updateProduct);
router.get('/exportCSV',isAuthenticated, isCompany, isProduct, exportProductCSV);
router.get('/exportExcel',isAuthenticated, isCompany, isProduct, exportProductExcel);
router.get('/print',isAuthenticated, isCompany, isProduct, printProductExcel);
router.post('/shareEmail',isAuthenticated, isCompany, isProduct, shareEmailProduct);
router.post('/import', upload.single('file'),isAuthenticated, isCompany, isProduct, importProductData);


module.exports= router;