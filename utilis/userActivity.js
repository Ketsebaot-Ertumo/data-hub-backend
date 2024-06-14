const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const Activity = require('../models/userActivityModel')(sequelize, DataTypes);

// const activity = (activity, email, next) => {
// }


const userActivity = async (activity, email) => {
        console.log('activity:', activity,"email:",email);
        const user_activity =await Activity.create({email, activity});
        await user_activity.save();
        // next();
}


module.exports = userActivity;