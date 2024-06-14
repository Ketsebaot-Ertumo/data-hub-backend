const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const User = require('../models/userModel')(sequelize, DataTypes);
const Sales = require('../models/salesModel')(sequelize, DataTypes);
const Product = require('../models/productModel')(sequelize, DataTypes);
const Organization = require('../models/organizationModel')(sequelize, DataTypes);
const Customer = require('../models/customerModel')(sequelize, DataTypes);
const Branch = require('../models/branchModel')(sequelize, DataTypes);
const { Op } = require('sequelize');
const userActivity = require('../utilis/userActivity');





exports.filterTcustomer = async (req, res, next) => {
    // if (!req.query || Object.keys(req.query).length === 0) {
    //   return res.status(400).json({ success: false, message: 'Please provide filtered value/s.' });
    // }
    try {
      const whereConditions = []; 
  
      for (const [columnName, columnValue] of Object.entries(req.query)) {
        if (columnName === 'regionstate' || columnName === 'subcity' || columnName === 'woreda' || columnName === 'ketena' ) {
          whereConditions.push({
            [Op.or]: [
              { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
            ],
          });
        }
        }

        // const region = await Customer.findAll({
        //   attributes: [[sequelize.literal('DISTINCT "regionstate"'), 'regionstate']],
        //   // where: { [Op.and]: whereConditions },
        //   where: {
        //     [Op.and]: [whereConditions,{regionstate: {[Op.not]: null }}]
        //   },
        //   raw: true,
        // });

        const region = await Customer.findAll({
          attributes: [
            [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('regionstate'))), 'regionstate']
          ],
          where: {
            [Op.and]: [whereConditions, { regionstate: { [Op.not]: null }}]
          },
          group: [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('regionstate')))],
          raw: true
        });

        const subcity = await Customer.findAll({
          attributes: [
            [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('subcity'))), 'subcity']
          ],
          where: {
            [Op.and]: [whereConditions, { subcity: { [Op.not]: null }}]
          },
          group: [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('subcity')))],
          raw: true
        });
      // subcity = subcity.map(entry => entry.subcity);

      const woreda = await Customer.findAll({
        attributes: [
          [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('woreda'))), 'woreda']
        ],
        where: {
          [Op.and]: [whereConditions, { woreda: { [Op.not]: null }}]
        },
        group: [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('woreda')))],
        raw: true
      });

      const ketena = await Customer.findAll({
        attributes: [
          [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('ketena'))), 'ketena']
        ],
        where: {
          [Op.and]: [whereConditions, { ketena: { [Op.not]: null }}]
        },
        group: [sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('ketena')))],
        raw: true
      });
  
      res.status(200).json({ success: true, region,subcity,woreda,ketena });
    } catch (error) {
      console.error('Error executing search:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };



  exports.filterTproduct = async (req, res, next) => {
    // if (!req.query || Object.keys(req.query).length === 0) {
    //   return res.status(400).json({ success: false, message: 'Please provide filtered value/s.' });
    // }
    try {
      const whereConditions = []; 
  
      for (const [columnName, columnValue] of Object.entries(req.query)) {
        if (columnName === 'kenema_pharmacy_drug_shop_number' || columnName === 'pharmacological_category' || columnName === 'manufacturer' || columnName === 'description' || columnName === 'unit' | columnName === 'brand') {
          whereConditions.push({
            [Op.or]: [
              { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
            ],
          });
        }
        }

        const branch = await Product.findAll({
          attributes: [[sequelize.literal('DISTINCT "kenema_pharmacy_drug_shop_number"'), 'kenema_pharmacy_drug_shop_number']],
          where: {[Op.and]: [whereConditions,{kenema_pharmacy_drug_shop_number: {[Op.not]: null }}]},
          raw: true,
        });

        const category = await Product.findAll({
            attributes: [[sequelize.literal('DISTINCT "pharmacological_category"'), 'pharmacological_category']],
            where: {[Op.and]: [whereConditions,{pharmacological_category: {[Op.not]: null }}]},
            raw: true,
      });
      // subcity = subcity.map(entry => entry.subcity);

      const manufacturer = await Product.findAll({
        attributes: [[sequelize.literal('DISTINCT "manufacturer"'), 'manufacturer']],
        where: {[Op.and]: [whereConditions,{manufacturer: {[Op.not]: null }}]},
        raw: true,
      });

      const description = await Product.findAll({
        attributes: [[sequelize.literal('DISTINCT "description"'), 'description']],
        where: {[Op.and]: [whereConditions,{description: {[Op.not]: null }}]},
        raw: true,
      });

      const unit = await Product.findAll({
        attributes: [[sequelize.literal('DISTINCT "unit"'), 'unit']],
        where: {[Op.and]: [whereConditions,{unit: {[Op.not]: null }}]},
        raw: true,
      });

      const brand = await Product.findAll({
        attributes: [[sequelize.literal('DISTINCT "brand"'), 'brand']],
        where: {[Op.and]: [whereConditions,{brand: {[Op.not]: null }}]},
        raw: true,
      });

      const allBranchList = await Branch.findAll({
        attributes: [[sequelize.literal('DISTINCT "branch_name"'), 'branch_name']],
        where: {branch_name: {[Op.not]: null }},
        raw: true,
      });

      if (req.user.email !== undefined) {
        await userActivity("filtered titles for product data", req.user.email);
      }
  
      res.status(200).json({ success: true,allBranchList, branch,category,manufacturer,brand,unit,description });
    } catch (error) {
      console.error('Error executing search:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };



