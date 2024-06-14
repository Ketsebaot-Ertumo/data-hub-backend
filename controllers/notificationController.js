const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const Notification = require('../models/notificationModel')(sequelize, DataTypes);
const userActivity = require('../utilis/userActivity');



exports.createNotif = async (req, res) => {
    const { title, body, email } = req.body;
    try {
      if(!title || !body || !email){
        res.status(402).json({success:false, message: 'Please provide title,body or email'});
      }else{
      const notification = await Notification.create({title,body,email});
      if(req.user.email !== undefined){
         await userActivity('created notification.', req.user.email );
       }
      res.status(201).json({success:true,notification});
    }
  } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({success:false, message: 'Failed to create notification',error:error.message });
    }
  };



  exports.createNotification = async (title, body, email) => {
    try {
      // const notification = await Notification.findOne({ where: { email,title,body } });
      // if (notification) {
      //   return res.status(404).json({ message: 'Notification already exist!' });
      // }
      await Notification.create({title,body,email});
  } catch (error) {
      console.error('Error creating notification:', error);
    }
  };



  exports.allNotifications = async (req, res) => {
    try {
      let notification;
      const { page, limit } = req.query;
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 20;
  
      const whereCondition = req.user.roles.includes('admin')
        ? { isRead: false }
        : { email: req.user.email, isRead: false };
  
      const totalCount = await Notification.count({ where: whereCondition });
      const totalPages = Math.ceil(totalCount / pageSize);
  
      notification = await Notification.findAll({
        where: whereCondition,
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize, // Calculate the offset based on the requested page
      });
  
      if (req.user.email !== undefined) {
        await userActivity('viewed all notifications list', req.user.email);
      }
  
      res.status(200).json({
        success: true,
        notification,
        pagination: {
          total: totalCount,
          page: pageNumber,
          pageSize,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to show notifications list.',
        error: error.message,
      });
    }
  };



// exports.allNotifications = async (req, res) => {
//     try {
//       const notification = await Notification.findAll({where: {isRead:false}});
//       if(req.user.email !== undefined){
//          await userActivity('viewed all notifications list', req.user.email );
//        }
//       res.status(200).json({success:true,notification});
//     } catch (error) {
//       console.error('Error showing notification:', error);
//       res.status(500).json({success:false, message: 'Failed to show notifications list.',error:error.message });
//     }
//   };


  // exports.allNotifications = async (req, res) => {
  //   try {
  //     let notification;
  //     if(req.user.roles.includes('admin')){
  //        notification = await Notification.findAll({where: {isRead:false}});
  //     }else{
  //       if(req.user.email !== undefined){
  //        notification = await Notification.findAll({where: {email:req.user.email,isRead:false}});
  //     }}
  //     // const notification = await Notification.findAll({where: {isRead:false}});
  //     if(req.user.email !== undefined){
  //        await userActivity('viewed all notifications list', req.user.email );
  //      }
  //     res.status(200).json({success:true,notification});
  //   } catch (error) {
  //     console.error('Error showing notification:', error);
  //     res.status(500).json({success:false, message: 'Failed to show notifications list.',error:error.message });
  //   }
  // };



  exports.notification = async (req, res) => {
    const { email } = req.query;
    try {
      if (!email) {
        return res.status(402).json({ success: false, message: 'Please provide email' });
      }
      const { page, limit } = req.query;
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 20;
  
      const whereCondition = { email: email.toLowerCase(), isRead: false };
  
      const totalCount = await Notification.count({ where: whereCondition });
      const totalPages = Math.ceil(totalCount / pageSize);
  
      const notification = await Notification.findAll({
        where: whereCondition,
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
      });
  
      if (req.user.email !== undefined) {
        await userActivity('viewed a notification.', req.user.email);
      }
  
      res.status(201).json({
        success: true,
        notification,
        pagination: {
          total: totalCount,
          page: pageNumber,
          pageSize,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      res.status(500).json({ success: false, message: 'Failed to show a notification.', error: error.message });
    }
  };



// exports.notification = async (req, res) => {
//     const { email } = req.query;
//     try {
//       if(!email){
//         return res.status(402).json({success:false, message: 'Please provide email'});
//       }
//       const notification = await Notification.findAll({where:{email:email.toLowerCase(),isRead:false},});
//       if(req.user.email !== undefined){
//          await userActivity('viewed a notification.', req.user.email );
//        }
//       res.status(200).json({success:true,notification});
//     } catch (error) {
//       console.error('Error showing notification:', error);
//       res.status(500).json({success:false, message: 'Failed to show a notification.',error:error.message });
//     }
//   };



exports.editNotification = async (req, res) => {
    // const { title, body, email,newEmail,newTitle,newBody } = req.body;
    const { id,newEmail,newTitle,newBody,newRead,newSelected } = req.body;
    try {
      if(!id){
        return res.status(402).json({success:false, message: 'Please provide id'});
      }
      // const notification = await Notification.findOne({where:{email,title,body} });
      const notification = await Notification.findOne({where:{id} });
      if (newEmail && newEmail !== notification.email) {
        notification.email = newEmail;
       }
      if (newTitle && newTitle !== notification.title) {
        notification.title = newTitle;
       }
      if (newBody && newBody !== notification.body) {
        notification.body = newBody;
       }
       if (newRead && newRead !== notification.isRead) {
        notification.isRead = newRead;
       }
       if (newSelected && newSelected !== notification.isSelected) {
        notification.isSelected = newSelected;
       }
      await notification.save();
      if(req.user.email !== undefined){
         await userActivity('edited notification', req.user.email );
       }
      res.status(201).json({success:true,notification});
     }catch (error) {
      console.error('Error editing notification:', error);
      res.status(500).json({success:false, message: 'Failed to edit a notification.',error:error.message });
    }
  };



exports.deleteNotification = async (req, res) => {
    // const { title, body, email} = req.body;
    const { id} = req.query;
    try {
      if(!id){
        return res.status(402).json({success:false, message: 'Please provide id'});
      }
      const notification = await Notification.findOne({where:{id} });
      await notification.destroy();
      if(req.user.email !== undefined){
        await userActivity('deleted notification', req.user.email );
      }
      res.status(200).json({success: true,message: 'Successfully deleted.',});
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({success:false, message: 'Failed to delete a notification.',error:error.message });
    }
  };