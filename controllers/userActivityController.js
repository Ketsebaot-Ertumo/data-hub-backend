const {sequelize} = require('../models/index')
const DataTypes = require('sequelize');
const userActivity = require('../utilis/userActivity');
const Activity = require('../models/userActivityModel')(sequelize, DataTypes);


// show activity of user
exports.showUserActivity = async (req, res, next) => {
  try {
    let activity;
    // Pagination parameters
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const offset = (pageNumber - 1) * pageSize;
    console.log(req.user.email, req.user.roles);
    if (req.user.email === undefined && !req.user.roles.includes("admin")) {
      return res.status(402).json({ success: false, message: 'You have no logged activity!' });
    }
    if (!req.user.roles.includes("admin") && req.user.email !== undefined) {
        activity = await Activity.findAndCountAll({
          where: { email: req.user.email },
          attributes: ['email', 'activity', 'createdAt'],
          offset,
          limit: pageSize,
        });
      } else {
        activity = await Activity.findAndCountAll({
          attributes: ['email', 'activity', 'createdAt'],
          offset,
          limit: pageSize,
        });
      }
      if (req.user.email !== undefined) {
        await userActivity('show user activity.', req.user.email);
      }
      if (activity.count === 0) {
       return  res.status(200).json({ success: true, message: 'No activity logged!' });
      }
      res.status(200).json({
          success: true,
          activity: activity.rows,
          pagination: {
            total: activity.count,
            page: pageNumber,
            pageSize,
            totalPages: Math.ceil(activity.count / pageSize),
          },
        });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


//show activity of user
// exports.showUserActivity= async (req,res,next) => {
//     try{
//       let activity;
//       console.log(req.user.email,req.user.roles)
//       if(req.user.email === undefined && !req.user.roles.includes("admin") ){
//         res.status(402).json({success: false,message: 'You have no loged activity!'});
//       }
//       else {
//         if(!req.user.roles.includes("admin") && req.user.email !== undefined){
//           activity = await Activity.findAll({where:{email: req.user.email},attributes: ['email', 'activity', 'createdAt']});
//         }
//         else{
//           activity = await Activity.findAll({attributes: ['email', 'activity', 'createdAt']});
//         }
//         if(req.user.email !== undefined){
//           await userActivity('show user activity.', req.user.email );
//         }
//         if(activity.length === 0){
//           res.status(200).json({success: true, message:'Have no activity loged!' });
//         }
//         else{
//           res.status(200).json({success: true, activity });}
//       }
//     }catch (err) {
//         console.error(err);
//         res.status(500).json({success: false,message: 'Server error',error:err.message});
//       }
// }



//show activity of user
exports.show= async (req,res,next) => {
    const {email} = req.query;
    if(!email){
      return res.status(204).json({success: false, message:'Please provide email!' });
    }
    try{
        const activity = await Activity.findAll({where:{email},attributes: ['email', 'activity', 'createdAt']});
        if(req.user.email !== undefined){
          await userActivity(`show a ${email} user activity.`, req.user.email );
        }
        if(!activity){
          res.status(404).json({success: true, message:'Have no activity loged for this user or user not found!' });
        }
        res.status(200).json({success: true, activity });
    }catch (err) {
        console.error(err);
        res.status(500).json({success: false,message: 'Server error',error:err.message});
      }
    }


