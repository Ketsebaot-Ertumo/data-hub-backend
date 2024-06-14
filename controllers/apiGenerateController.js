const jwt = require('jsonwebtoken');
const userActivity = require('../utilis/userActivity');
const {sequelize} = require('../models/index')
const DataTypes = require('sequelize');
const RP = require('../models/rpModel')(sequelize, DataTypes);


exports.generateTokenForRole = async (req, res,next) => {
  const { roles,compantType } = req.body;
  try {
      const payload = { roles,compantType };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.status(200).json({ success: true, token, decoded });
      if(req.user.email !== undefined){
        await userActivity('generate API.', req.user.email );
      }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
};




