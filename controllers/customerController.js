const axios = require('axios');
const { sequelize } = require('../models/index')
const DataTypes = require('sequelize')
const Customer = require('../models/customerModel')(sequelize, DataTypes);
const { shareWithEmail } = require('../utilis/sendEmail');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const path = require('path');
const os = require('os');
const { Op } = require('sequelize');
const schedule = require('node-schedule');
const userActivity = require('../utilis/userActivity');
const { createNotification } = require('./notificationController');
const { convertAmharicToEnglish } = require('./test');
const RP = require('../models/rpModel')(sequelize, DataTypes);



// schedule.scheduleJob('0 0 */12 * *', async () => {
  let limit_start=1;
  const limit_page_length=3000;
  const {password, cURL}=process.env;

  async function fetchDataAndStore() {
    try {
      customerURL= `${cURL}limit_page_length=${limit_page_length}&limit_start=${limit_start}&password=${password}`;
      // console.log(customerURL, limit_start, limit_page_length);
      // limit_start += limit_page_length;
      // console.log(customerURL, limit_start, limit_page_length);
      const response = await axios.get(customerURL);
      const data = response.data.data;

      // limit_start += data.length;
      // console.log(limit_start, limit_page_length);

      await processAndInsertData(data);

      limit_start += data.length;
      // console.log(limit_start, limit_page_length);  //to stop if error occur
  
      console.log('Successfully fetched and stored.');
      } catch (error) {
      console.error('Error on scraping/storing data:', error);
      await createNotification('Error on fetching and storing customer data', `An error occurred while fetching and storing customer data. Error: ${error}`,'techethio@etyop.com')
      }
  }
  // Schedule the initial fetching and storing of data
  fetchDataAndStore();
  
  // const job = schedule.scheduleJob('0 * * * *', fetchDataAndStore); // Run every hour at the start of the hour
  // const job = schedule.scheduleJob('0 5,17 * * *', fetchDataAndStore);//every 5pm and 5am
  // const job1 = schedule.scheduleJob('0 0 * * *', fetchDataAndStore); // 12:00 AM
  // const job2 = schedule.scheduleJob('0 18 * * *', fetchDataAndStore); // 6:00 PM
  const job = schedule.scheduleJob('*/1 * * * *', fetchDataAndStore);//every minute



exports.customerData = async (req, res) => {
  try {
    const response = await axios.get(process.env.customerURL);
    const data = response.data.data;
    await processAndInsertData(data);

    res.status(200).json({
      success: true,
      message: 'Successfully scraped/fetched, and stored data.',
      data,count:data.length
    });
  } catch (error) {
    console.error('Error on scraping/storing data:', error);
    res.status(500).json({
      success: false,
      message: 'Error on scraping and storing data',
    });
  }
};


//show all customers
exports.showCustomers = async (req, res) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = "customer";
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity("viewed customers data", req.user.email);
    }

    // Pagination parameters
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const customersCount = await Customer.count({
      where: { full_name: { [Op.not]: '' } }
    });
    const totalPages = Math.ceil(customersCount / pageSize);

    const customers = await Customer.findAll({
      where: { full_name: { [Op.not]: '' } },
      attributes: ['full_name', 'customer_type', 'code', 'birth_date', 'gender', 'regionstate', 'subcity', 'woreda', 'ketena', 'house_number', 'age'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize
    });

    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total: customersCount,
        page: pageNumber,
        pageSize,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


// //show all customers
// exports.showCustomers = async (req, res) => {
//   try{
//       if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//         const role="customer";
//         const rp = await RP.findOne({where: {role}});
//         const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//         // console.log(hasReadPermission);
//         if(hasReadPermission !== true){
//           return res.status(402).json({success: false,message:'Have no permission.' });
//         }
//         await userActivity("viewed customers data", req.user.email );
//       }
//       const customers = await Customer.findAll({
//         where: { full_name: { [Op.not]: '' },  },
//         attributes: ['full_name', 'customer_type','code', 'birth_date', 'gender', 'regionstate','subcity', 'woreda', 'ketena', 'house_number','age']
//       });
//       // await userActivity("viewed customers data", req.user.email );
//       res.status(200).json({success: true,customers,count:customers.length});
//   }catch (err) {
//     console.error(err);
//     res.status(500).json({success: false,message: 'Server error',error:err.message});
//   }
// };



exports.showCreditCustomers = async (req, res) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = "customer";
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(
        (permission) => permission.permission === "read" && permission.granted === true
      );
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity("viewed credit customers data", req.user.email);
    }

    const { page, limit } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;
    

    const customersCount = await Customer.count({
      where: { full_name: { [Op.not]: '' }, customer_type: "Credit Customer" },
    });

    const totalPages = Math.ceil(customersCount / pageSize);

    const customers = await Customer.findAll({
      where: { full_name: { [Op.not]: '' }, customer_type: "Credit Customer" },
      attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate', 'subcity', 'woreda', 'ketena', 'house_number', 'age'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: "Credit customers not found." });
    }

    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total: customersCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


// //show all credit customers
// exports.showCreditCustomers = async (req, res) => {
//   try{
//       if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//         const role="customer";
//         const rp = await RP.findOne({where: {role}});
//         const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//         // console.log(hasReadPermission);
//         if(hasReadPermission !== true){
//           return res.status(402).json({success: false,message:'Have no permission.' });
//         }
//         await userActivity("viewed credit customers data", req.user.email );
//       }
//       const customers = await Customer.findAll({
//         where: { full_name: { [Op.not]: '' }, customer_type: "Credit Customer" },
//         attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate','subcity', 'woreda', 'ketena', 'house_number','age']
//       });
//       if(customers.length === 0){
//         res.status(404).json({success: false,message:"Cash customers not found."});
//       }
//       // await userActivity("viewed credit customers data", req.user.email );
//       res.status(200).json({success: true,customers});
//   }catch (err) {
//     console.error(err);
//     res.status(500).json({success: false,message: 'Server error',error:err.message});
//   }
// };




exports.showCashCustomers = async (req, res) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = "customer";
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(
        (permission) => permission.permission === "read" && permission.granted === true
      );
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity("viewed cash customers data", req.user.email);
    }

    const { page, limit } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const customersCount = await Customer.count({
      where: { full_name: { [Op.not]: '' }, customer_type: "Cash Customer" },
    });

    const totalPages = Math.ceil(customersCount / pageSize);

    const customers = await Customer.findAll({
      where: { full_name: { [Op.not]: '' }, customer_type: "Cash Customer" },
      attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate', 'subcity', 'woreda', 'ketena', 'house_number', 'age'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: "Cash customers not found." });
    }

    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total: customersCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};



// //show all cash customers
// exports.showCashCustomers = async (req, res) => {
//   try{
//   if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//     const role="customer";
//     const rp = await RP.findOne({where: {role}});
//     const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//     // console.log(hasReadPermission);
//     if(hasReadPermission !== true){
//       return res.status(402).json({success: false,message:'Have no permission.' });
//     }
//     await userActivity("viewed credit customers data", req.user.email );
//   }
//   const customers = await Customer.findAll({
//     where: { full_name: { [Op.not]: '' }, customer_type: "Cash Customer" },
//     attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate','subcity', 'woreda', 'ketena', 'house_number','age']
//   });
//   if(customers.length === 0){
//     res.status(404).json({success: false,message:"Credit customers not found."});
//   }
//   // await userActivity("viewed credit customers data", req.user.email );
//   res.status(200).json({success: true,customers});
// }catch (err) {
//   console.error(err);
//   res.status(500).json({success: false,message: 'Server error',error:err.message});
// }
// };



exports.showDependents = async (req, res) => {
  // const { full_name, code } = req.body;
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({status: false, message: 'Please provide the customer code or full_name'});
  }
  try {
  if(req.user.email !== undefined && !req.user.roles.includes('admin')){
    const role="customer";
    const rp = await RP.findOne({where: {role}});
    const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
    // console.log(hasReadPermission);
    if(hasReadPermission !== true){
      return res.status(402).json({success: false,message:'Have no permission.' });
    }
    await userActivity("viewed credit customer family data", req.user.email );
  }
  const query = `
    SELECT dependet_full_name, dependet_code, dependet_gender, dependet_birth_date, dependet_relation, dependet_registration_date
    FROM "Customers" WHERE (code = '${code}' OR (code = '' AND id > (SELECT id FROM "Customers" WHERE code = '${code}')
    AND id < (SELECT MIN(id) FROM "Customers" WHERE code != '' AND id > (SELECT id FROM "Customers" WHERE code = '${code}'))))
    AND dependet_full_name IS NOT NULL`;
  
    const dependents = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
    if(!dependents){
      return res.status(404).json({status: false, message: 'Customer or Dependent not found.'});
    }
    // await userActivity("viewed credit customer family data", req.user.email );
    res.status(200).json({success: true,dependentsNumber:dependents.length, dependents });
  } catch (error) {
    console.log('Error retrieving dependents:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while retrieving dependents.',
      message: error.message,
    });
  }
};



//show customer profile
exports.customer = async (req, res) => {
  const { code,} = req.query;
  // console.log('Code:', code);
  if(!code){
    return res.status(400).json({success:false,message:"Please add customer code."});
  }
  try{
  if(req.user.email !== undefined && !req.user.roles.includes('admin')){
    const role="customer";
    const rp = await RP.findOne({where: {role}});
    const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
    // console.log(hasReadPermission);
    if(hasReadPermission !== true){
      return res.status(402).json({success: false,message:'Have no permission.' });
    }
    await userActivity("viewed a customer data", req.user.email );
  }
  const countQuery = `
    SELECT COUNT(*) AS dependents_count
    FROM "Customers" WHERE (code = '${code}' OR (code = '' AND id > (SELECT id FROM "Customers" WHERE code = '${code}')
    AND id < (SELECT MIN(id) FROM "Customers" WHERE code != '' AND id > (SELECT id FROM "Customers" WHERE code = '${code}'))))
    AND dependet_full_name IS NOT NULL`;
  // const customer = await Customer.findOne({ where: { code }, attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate', 'woreda', 'kebele', 'house_number'], });
  const customer = await Customer.findOne({ where: { code }, attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate','subcity', 'woreda', 'ketena', 'house_number','age'], });
  if(!customer){
    return res.status(404).json({message:"customer not found"});
  }
  const countResult = await sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT });
  const dependentsCount = countResult[0].dependents_count;
  // await userActivity("viewed a customer data", req.user.email );
  res.status(200).json({success: true,dependants: dependentsCount,customer});
}catch(err){
  console.log(err);
  res.status(500).json({success: false,message: 'An error occurred while deleting.',error: err.message,});
}
}


//show dependent profile
exports.dependent = async (req, res) => {
  const { dependet_code} = req.body;
  const dependent = await Customer.findOne({where: {dependet_code}, attributes: ['dependet_full_name', 'dependet_code', 'dependet_gender', 'dependet_birth_date', 'dependet_relation', 'dependet_registration_date', 'dependet_Phone', 'creation', 'modified'], });
  res.status(200).json({
      success: true,
      dependent
  });
}


//delete customer data
exports.deleteCustomer = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(201).json({message:"Please provide the customer's full_name or code to show its dependents."});
  }
  try {
  if(req.user.email !== undefined && !req.user.roles.includes('admin')){
    const role="customer";
    const rp = await RP.findOne({where: {role}});
    const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
    // console.log(hasReadPermission);
    if(hasReadPermission !== true){
      return res.status(402).json({success: false,message:'Have no permission.' });
    }
    await userActivity("deleted a customer data", req.user.email );
  }
  const query = `
    SELECT * FROM "Customers" WHERE (code = '${code}' OR (code = '' AND id > (SELECT id FROM "Customers" WHERE code = '${code}')
    AND id < (SELECT MIN(id) FROM "Customers" WHERE code != '' AND id > (SELECT id FROM "Customers" WHERE code = '${code}'))))
    AND dependet_full_name IS NOT NULL`;

    const customers = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
    for (const customer of customers) {
      await Customer.destroy({ where: { id: customer.id } });
    }
    await userActivity("deleted customer data", req.user.email );
    res.status(200).json({
      success: true,
      message: "Deleted successfully"
    });
  } catch (error) {
    console.log('Error on deleteing customer:', error);
    // await userActivity("deleted a customer data", req.user.email );
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting.',
      message: error.message,
    });
  }
};




exports.deleteDependent = async (req, res, next) => {
  const { dependet_full_name, dependet_code, } = req.query;
  if(!dependet_code || !dependet_full_name){
    return res.status(404).json({success:false, message:'Please add dependent detail.'});
  }
  try {
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="customer";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("deleted customer dependents data", req.user.email );
    }
    const customer = await Customer.findOne({ where: { dependet_full_name, dependet_code } });
    if (!customer) {
      return res.status(404).json({ message: 'Dependent family not found or has been deleted before' });
    }
    // await customer.destroy();
    const attributes = ['dependet_full_name', 'dependet_code', 'dependet_gender', 'dependet_birth_date', 'dependet_relation', 'dependet_registration_date', 'dependet_Phone', 'creation', 'modified'];
    await Customer.destroy(customer, { fields: attributes });
    // await userActivity("deleted customer dependents data", req.user.email );
    res.status(200).json({success:true, message: 'Dependent family deleted successfully',});
  } catch (err) {
    next(err);
  }
};



//customer profile update
exports.updateCustomer = async (req, res, next) => {
  const { code, newFull_name, newCode, newWoreda, newHouse_number, newKebele, newBirth_date, newPhone_number, newGender } = req.body;
  if (!code) {
    return res.status(201).json({message:"Please provide the customer's code to show its dependents."});
  }
  try {
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="customer";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("updated customer data", req.user.email );
    }
    const customer = await Customer.findOne({ where: { code, } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or deleted before.' });
    }
    if (newFull_name && newFull_name !== customer.full_name) {
      customer.full_name = newFull_name;
    }
    if (newCode && newCode !== customer.code) {
      customer.code = newCode;
    }
    if (newWoreda && newWoreda !== customer.woreda) {
      customer.woreda = newWoreda;
    }
    if (newHouse_number && newHouse_number !== customer.house_number) {
      customer.house_number = newHouse_number;
    }
    if (newKebele && newKebele !== customer.kebele) {
      customer.house_number = newHouse_number;
    }
    if (newPhone_number && newPhone_number !== customer.phone_number) {
      customer.phone_number = newPhone_number;
    }
    if (newBirth_date && newBirth_date !== customer.birth_date) {
      customer.birth_date = newBirth_date;
    }
    if (newGender && newGender !== customer.gender) {
      customer.gender = newGender;
    }
    await customer.save();
    // await userActivity("updated customer data", req.user.email );
    res.status(200).json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (err) {
    next(err);
  }
};





//dependent profile update
exports.updateDependent = async (req, res, next) => {
  const { dependet_code, newFull_name, newCode, newBirth_date, newRelation, newRegistration_date, newGender, newPhone_number } = req.body;
  if(!dependet_code || !dependet_full_name){
    return res.status(404).json({success:false, message:'Please add dependent detail.'});
  }
  try {
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="customer";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("updated customer family data", req.user.email );
    }
    const customer = await Customer.findOne({ where: { dependet_code } });
    if (!customer) {
      return res.status(404).json({success:false, message: 'Dependent not found or deleted before.' });
    }
    if (newFull_name && newFull_name !== customer.dependet_full_name) {
      customer.dependet_full_name = newFull_name;
    }
    if (newCode && newCode !== customer.dependet_code) {
      customer.dependet_code = newCode;
    }
    if (newRelation && newRelation !== customer.dependet_relation) {
      customer.dependet_relation = newRelation;
    }
    if (newRegistration_date && newRegistration_date !== customer.dependet_registration_date) {
      customer.dependet_registration_date = newRegistration_date;
    }
    if (newGender && newGender !== customer.dependet_gender) {
      customer.dependet_gender = newGender;
    }
    if (newPhone_number && newPhone_number !== customer.dependet_phone) {
      customer.dependet_phone = newPhone_number;
    }
    if (newBirth_date && newBirth_date !== customer.birth_date) {
      customer.birth_date = newBirth_date;
    }
    await customer.save();
    // await userActivity("updated customer family data", req.user.email );
    res.status(200).json({
      message: 'Dependet updated successfully',
      customer
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({success:false, message: 'server error.', error:err.message});
  }
};





let fileNameCounter = 1;

// Export data with CSV
exports.exportCustomerCSV = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    if (!Array.isArray(attributes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attributes provided, Please check attribute name.',
      });
    }
    const columnNames = Object.keys(Customer.rawAttributes);
    const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
    const attributeTitles = filteredColumnNames.map(column => Customer.rawAttributes[column].field || column);

    const fileName = `Customer-Title${fileNameCounter}.csv`;
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);

    await createCSV(attributeTitles, filePath);
    res.download(filePath, fileName);
    res.status(200).json({
      success: true,
      message: 'Successfully Downloaded a new CSV file.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function createCSV(attributeTitles, filePath) {
  const csvWriter = createCsvWriter({
    path: filePath,
    header: attributeTitles.map((title, index) => ({ id: `col${index}`, title })),
  });

  return csvWriter.writeRecords([])
    .then(() => { console.log('CSV file written successfully'); })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}



// Export data with Excel
exports.exportCustomerExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Customer.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Customer.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
    const fileName = `Customer-Title${fileNameCounter}.xlsx`; //generated excel file
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);

    await createExcel(attributeTitles, filePath);  //you need to uncomment if you want to download file to local 'downloads'.
    // if(req.user.email !== undefined){
    //   await userActivity("imported customer data", req.user.email );
    // }
    res.download(filePath, fileName);  //you need to uncomment if you want to download file to local 'downloads'.
    res.status(200).json({ success: true, message: 'Successfully Show/Downloaded a new Excel file.',attributeTitles });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false,message: 'Server error',error:error.message});
  }
};


// // Export data with Excel
// exports.exportCustomerExcel = async (req, res) => {
//   try {
//     const attributes = req.body.attributes;
//     if (!Array.isArray(attributes)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid attributes provided.',
//       });
//     }
//     // const attributeTitles = attributes.map(attribute => Customer.rawAttributes[attribute].field || attribute);
//     const columnNames = Object.keys(Customer.rawAttributes);
//     const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
//     const attributeTitles = filteredColumnNames.map(column => Customer.rawAttributes[column].field || column);
//     console.log(attributeTitles)

//     const fileName = `Customer-Title${fileNameCounter}.xlsx`;
//     fileNameCounter++;
//     const filePath = path.join(os.homedir(), 'Downloads', fileName);

//     await createExcel(attributeTitles, filePath);
//     res.download(filePath, fileName);
//     res.status(200).json({
//       success: true,
//       message: 'Successfully Downloaded a new Excel file.',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

function createExcel(attributeTitles, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  worksheet.addRow(attributeTitles);

  return workbook.xlsx.writeFile(filePath)
    .then(() => {
      console.log('Excel file written successfully');
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}



const generateCustomerExcel = async (req, res) => {
  try {
    console.log(req.query)
    // Pagination parameters
    const { page, limit } = req.query;
    let customers;
    // console.log(req.query)
    if(!page && !limit){
       customers = await Customer.findAll();
    }else{
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 20;

        const customersCount = await Customer.count();
        const totalPages = Math.ceil(customersCount / pageSize);

        customers = await Customer.findAll({
          // attributes: ['full_name', 'customer_type', 'code', 'birth_date', 'gender', 'phone_number', 'regionstate', 'woreda', 'kebele', 'house_number', 'dependet_full_name', 'dependet_code', 'dependet_gender', 'dependet_birth_date', 'dependet_relation', 'dependet_registration_date', 'dependet_phone'],
          offset: (pageNumber - 1) * pageSize,
          limit: pageSize
        });
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customer Data');
    const tableHeaders = ['Customer Name','customer_type', 'Code', 'Birth Date', 'Gender', 'Phone Number', 'Region/State','Subcity', 'Woreda', 'Kebele', 'House Number', 'Dependent Name', 'Dependent Code', 'Dependent Gender', 'D. Birth Date', 'Relation', 'Registration Date', 'Dependent Phone'];
    worksheet.addRow(tableHeaders);

    for (const customer of customers) {
      let rowData = [
        customer.full_name ,
        customer.customer_type,
        customer.code ,
        customer.birth_date ? customer.birth_date.toString() : '',
        customer.gender,
        customer.phone_number ? customer.phone_number.toString() : '',
        customer.regionstate,
        customer.subcity,
        customer.woreda ,
        customer.ketena ,
        customer.house_number ,
        customer.dependet_full_name ,
        customer.dependet_code ,
        customer.dependet_gender,
        customer.dependet_birth_date ? customer.dependet_birth_date.toString() : '',
        customer.dependet_relation,
        customer.dependet_registration_date,
        customer.dependet_phone
      ];
      worksheet.addRow(rowData);
    }

    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    return workbook;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// const generateCustomerExcel = async (req, res) => {
//   try {
//     const customerData = await Customer.findAll();
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Customer Data');
//     const tableHeaders = ['ID', 'Customer Name','customer_type', 'Code', 'Birth Date', 'Gender', 'Phone Number', 'Region/State','Subcity', 'Woreda', 'Kebele', 'House Number', 'Dependent Name', 'Dependent Code', 'Dependent Gender', 'D. Birth Date', 'Relation', 'Registration Date', 'Dependent Phone'];
//     worksheet.addRow(tableHeaders);

//     for (const customer of customerData) {
//       let rowData = [
//         customer.id ? customer.id.toString() : '',
//         customer.full_name ? customer.full_name.toString() : '',
//         customer.customer_type,
//         customer.code ? customer.code.toString() : '',
//         customer.birth_date ? customer.birth_date.toString() : '',
//         customer.gender,
//         customer.phone_number ? customer.phone_number.toString() : '',
//         customer.regionstate,
//         customer.subcity,
//         customer.woreda ? customer.woreda.toString() : '',
//         customer.kebele ? customer.kebele.toString() : '',
//         customer.house_number ? customer.house_number.toString() : '',
//         customer.dependet_full_name ? customer.dependet_full_name.toString() : '',
//         customer.dependet_code ? customer.dependet_code.toString() : '',
//         customer.dependet_gender,
//         customer.dependet_birth_date ? customer.dependet_birth_date.toString() : '',
//         customer.dependet_relation,
//         customer.dependet_registration_date,
//         customer.dependet_phone
//       ];
//       worksheet.addRow(rowData);
//     }
//     worksheet.columns.forEach(column => {
//       column.width = 15;
//     });
//     return workbook;
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };



// Print Excel
exports.printCustomerExcel = async (req, res) => {
  try {
    const workbook = await generateCustomerExcel();
    const pdfDoc = await workbook.xlsx.writeBuffer();
    const fileName = `Customer-Data-${fileNameCounter}.xlsx`;
    fileNameCounter++;

      // if (os.platform() === 'win32') {
      //   filePath = path.join(os.homedir(), 'Downloads',fileName);
      // } else {
      //   filePath = '/root/Downloads';
      // }

    const filePath = path.join(os.homedir(), 'Downloads', fileName);
    // console.log(os.platform());

    // Write the buffer to a file
    fs.writeFileSync(filePath, pdfDoc);

    console.log('Successfully generated Excel.');
    res.status(200).json({
      success: true,
      message: 'Successfully downloaded Excel.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





//sharePDF with email
exports.shareEmailCustomer = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Branch name is required in the request body' });
  }
  try {
    const workbook = await generateCustomerExcel(req,res);
    const pdfBuffer = await workbook.xlsx.writeBuffer();
    const fileName = `Customer-Data-${fileNameCounter}.xlsx`;
    fileNameCounter++;

    shareWithEmail(email, pdfBuffer, fileName)
      .then(() => {
        console.log('Shared Successfully.');
        res.status(200).json({
          success: true,
          message: 'Successfully Shared the PDF/file.',
        });
      })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





//import data
exports.importCustomerData = async (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).json({ success: false, message: 'file is required in the request body' });
  }
  let check;
  try {
    // let check;
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="customer";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "import" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("imported customer data", req.user.email );
    }
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/csv') {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {

        const workbook = xlsx.readFile(file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        // const importedData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const data = xlsx.utils.sheet_to_json(worksheet);
        check =await processAndInsertData(data);
        fs.unlinkSync(file.path);
        if(check){
          return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
        }else{
          return res.status(403).json({ success: false, message: 'No data imported.' ,check});
        }
        // return res.status(200).json({ success: true, message: 'Data imported successfully' });

      } else if (file.mimetype === 'text/csv') {
        let data = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (row) => {
            data.push(row);
          })
          .on('end', async () => {
            check= await processAndInsertData(data);
            console.log('new',file.path)
            fs.unlinkSync(file.path);
            if(check){
              return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
            }else{
              return res.status(403).json({ success: false, message: 'No data imported.' ,check});
            }
            // return res.status(200).json({ success: true, message: 'Data imported successfully' });
          });
      };
      // await userActivity("imported customer data", req.user.email );
      // console.log('check',check)
      // if(check){
      //   return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
      // }else{
      //   return res.status(403).json({ success: false, message: 'No data imported.' ,check});
      // }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid file format' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error',error:error.message });
  }
};



async function processAndInsertData(data) {
  let check=false;
  if (data.length === 0) {
    console.log('No data to process.');
    return;
  }
  try{
   for (const row of data) {
    if (!row.full_name) {
      // console.log('Skipping row without full_name:', row);
      continue;
    }
    // const existingCustomer = await Customer.findOne({ where: { full_name: row.full_name, } });
    const existingCustomer = await Customer.findOne({ where: { full_name: { [Op.iLike]: `%${row.full_name}%` } } });
    if (existingCustomer) {
      // existingCustomer.full_name = convertAmharicToEnglish(row.full_name);
      // await existingCustomer.save();
      if (!row.dependet_full_name) {
        // console.log(`Skipping customer ${row.full_name} without dependent information.`);
        continue;
      }
      // const existingFamily = await Customer.findOne({ where: { dependet_full_name: row.dependet_full_name }, });
      const existingFamily = await Customer.findOne({ where: { dependet_full_name: { [Op.iLike]: `%${row.dependet_full_name}%` } }, });
      if (existingFamily) {
        // existingFamily.dependet_full_name = convertAmharicToEnglish(row.dependet_full_name);
        // await existingFamily.save();
        // console.log(`Customer ${row.full_name} with dependent ${row.dependet_full_name} already exists in the database.`);
      } else {
        // row.dependet_full_name = await convertAmharicToEnglish(row.dependet_full_name);
        const attributes = ['dependet_full_name', 'dependet_code', 'dependet_gender', 'dependet_birth_date', 'dependet_relation', 'dependet_registration_date', 'dependet_Phone', 'creation', 'modified'];
        await Customer.create(row, { fields: attributes });
        // console.log(`Inserted family/dependent ${row.dependet_full_name} for customer ${row.full_name}.`);
        check=true;
      }
    } else {
      // console.log(`Customer ${row.full_name} does not exist in the database or may be deleted. Proceed with storing it.`);
      // row.full_name = convertAmharicToEnglish(row.full_name);
      // if(row.dependet_full_name){
      //   row.dependet_full_name = convertAmharicToEnglish(row.dependet_full_name);
      // }
      await Customer.create(row);
      check=true;
    }
  }
}catch(err){
  console.log(err)
}
  // console.log(check)
  return check
}