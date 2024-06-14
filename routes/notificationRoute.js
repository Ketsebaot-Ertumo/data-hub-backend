const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin,isCompany } = require('../middleware/auth');
const { allNotifications, notification, editNotification, deleteNotification, createNotif } = require('../controllers/notificationController');

// Route for sending notifications
router.post('/create',isAuthenticated,isAdmin ,createNotif );
router.get('/all',isAuthenticated,isCompany,allNotifications );
router.get('/show',isAuthenticated,isCompany,notification );
router.put('/edit',isAuthenticated,isCompany,isAdmin, editNotification);
router.delete('/delete',isAuthenticated,isCompany,deleteNotification );


module.exports = router;
