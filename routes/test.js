const express = require('express');
const { convertAmharicToEnglish, changeAllNames, changeAll } = require('../controllers/test');


const router = express.Router();

router.post('/convert', convertAmharicToEnglish);
router.put('/convertAll', changeAllNames);
router.put('/changeAll', changeAll);

module.exports = router;