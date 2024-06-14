const axios = require('axios');
const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const Sales = require('../models/salesModel')(sequelize, DataTypes);
const {shareWithEmail} = require('../utilis/sendEmail');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const path =require('path');
const os = require('os');
const { Op } = require('sequelize');
const schedule = require('node-schedule');
const userActivity = require('../utilis/userActivity');
const { createNotification } = require('./notificationController');
const RP = require('../models/rpModel')(sequelize, DataTypes);
const Customer = require('../models/customerModel')(sequelize, DataTypes);
const Branch = require('../models/branchModel')(sequelize, DataTypes);
const Product = require('../models/productModel')(sequelize, DataTypes);
const Organization = require('../models/organizationModel')(sequelize, DataTypes);






//fetch the sales data with given url
  let limit_start=1;
  const limit_page_length=1000;
  const {password, sURL}=process.env;

  async function fetchDataAndStore() {
    try {
      salesURL = `${sURL}limit_page_length=${limit_page_length}&limit_start=${limit_start}&password=${password}`;
      // console.log(salesURL, limit_start, limit_page_length);
      // limit_start += limit_page_length;
      // console.log(limit_start, limit_page_length);
      const response = await axios.get(salesURL);
      const data = response.data.data;
      
        // limit_start += limit_page_length;
        // limit_start += data.length;
        // console.log(limit_start, limit_page_length);
    
      await processAndInsertData(data);

      limit_start += data.length;
      // console.log(limit_start, limit_page_length);
  
      console.log('Successfully fetched and stored.');
      } catch (error) {
      console.error('Error on scraping/storing data:', error);
      await createNotification('Error on fetching and storing sales data', `An error occurred while fetching and storing sales data. Error: ${error}`,'techethio@etyop.com')
      }
  }
  // Schedule the initial fetching and storing of data
  fetchDataAndStore();

  // const job = schedule.scheduleJob('0 5,17 * * *', fetchDataAndStore);//every 5pm and 5am
  // const job1 = schedule.scheduleJob('0 0 * * *', fetchDataAndStore); // 12:00 AM
  // const job2 = schedule.scheduleJob('0 18 * * *', fetchDataAndStore); // 6:00 PM
  const job = schedule.scheduleJob('*/1 * * * *', fetchDataAndStore);//every minute






// for checking with end point only
exports.salesData = async (req, res, next) => {
  try {
    const response = await axios.get(process.env.salesURL);
    const data = response.data.data;
    await processAndInsertData(data);

    res.status(200).json({success: true,message: 'Successfully scraped and stored data.',data});
  } catch (error) {
    console.error('Error on scraping/storing data:', error);
    res.status(500).json({success: false,message: 'Error on scraping and storing data',});
  }
}



//show all sales attachement
exports.showSales = async (req, res) => {
  try{
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="sales";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("viewed sales data", req.user.email );
    }

    // const {daily,monthly,week,year,quarter} = req.query;
    const {timeInterval} = req.query;
    const Sale =[];
    const date = new Date().toISOString().slice(0, 10);
    const [year, month, day] = date.split('-');
    // console.log(year,month,day);

    //get yearly sales 
    if (timeInterval && timeInterval === 'year') {
      const m= month;
      for (let month = 1; month <= m; month++) {
        const monthStartDate = new Date(year, month - 1, 1);
        const monthEndDate = new Date(year, month, 0);
        console.log(monthStartDate, monthEndDate)
    
        const sales = await Sales.findOne({
          where: {
            creation: {
              [Op.between]: [monthStartDate, monthEndDate], // Filter sales within the current month
            },
          },
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('sum', sequelize.col('total_inc_vat')), 0), 'total'], // Calculate the sum of 'total' for the month, use 0 if null
          ],
        });
        const total = sales.dataValues.total;
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        Sale.push({ date: monthName, sum: total });
      }
    } 

    //get monthly sales
      if (timeInterval && timeInterval === 'month') {
      const endDate = new Date(year, month, 0);
    
      for (let day = 1; day <= endDate.getDate(); day++) {
        const currentDate = new Date(year, month - 1, day);
        const nextDay = new Date(year, month - 1, day + 1);
        console.log(currentDate, nextDay)
    
        const sales = await Sales.findOne({
          where: {
            creation: {
              [Op.between]: [currentDate, nextDay], // Filter sales within the current day
            },
          },
          attributes: [
            [sequelize.literal(`'${day}'`), 'day'],
            // [sequelize.fn('sum', sequelize.col('total')), 'total'], // Calculate the sum of 'total' for the day
            [sequelize.fn('coalesce', sequelize.fn('sum', sequelize.col('total_inc_vat')), 0), 'total'], // Calculate the sum of 'total' for the day or return 0 if null
          ],
        });
    
        const total = sales ? sales.dataValues.total : 0;
        const days=`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        Sale.push({ date:days, sum: total });
      }
    }
    
    //get weekly sales
    if (timeInterval && timeInterval === 'week') {
      const weekEndDate = new Date(year, month - 1, day);
      const weekStartDate = new Date(weekEndDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    
      for (let currentDay = weekStartDate; currentDay <= weekEndDate; currentDay.setDate(currentDay.getDate() + 1)) {
        const nextDay = new Date(currentDay);
        nextDay.setDate(nextDay.getDate() + 1);
    
        const sales = await Sales.findOne({
          where: {
            creation: {
              [Op.between]: [currentDay, nextDay],
            },
          },
          attributes: [
            [sequelize.literal(`DATE(creation)`), 'day'],
            [sequelize.fn('sum', sequelize.col('total_inc_vat')), 'total'],
          ],
          group: [sequelize.literal(`DATE(creation)`)]
        });
    
        const total = sales ? sales.dataValues.total : 0;
        Sale.push({ date: currentDay.toISOString().split('T')[0], sum: total });
      }
    }

    //get quarterlly sales
    if (timeInterval && timeInterval === 'quarter') {
      for (let i = 5; i >= 0; i--) {
        const currentMonth = new Date(year, month - i - 1, 1);
        const nextMonth = new Date(year, month - i, 0);
        console.log(currentMonth,nextMonth)
    
        const sales = await Sales.findOne({
          where: {
            creation: {
              [Op.between]: [currentMonth, nextMonth],
            },
          },
          // attributes: [[sequelize.fn('sum', sequelize.col('total')), 'total']],
          attributes: [[sequelize.fn('COALESCE', sequelize.fn('sum', sequelize.col('total_inc_vat')), 0), 'total']],
        });
    
        const total = sales ? sales.dataValues.total : 0;
        const monthName = new Date(year, currentMonth.getMonth()).toLocaleString('default', { month: 'long' });
        Sale.push({ date: monthName, sum: total });
      }
    } 

    // //fetch for only daily sales data
    // if(timeInterval && timeInterval === 'day'){
    //   const sales = await Sales.findAll({where: { creation: { [Op.iLike]: `%${date}%` } }});
    //   if (sales.length === 0) {
    //     Sale.push({date:date, total: 0 }); // If no sales data available, push an object with total 0 to Sale
    //   } else {
    //     sales.forEach(sale => {
    //       Sale.push({date:date, total: sale.total || 0 });
    //     });
    //   }
    // }

    if (timeInterval && timeInterval === 'day') {
      const startDate = new Date(year, month - 1, day, 0, 0, 0); // Set the start date to the beginning of the selected day
      const endDate = new Date(year, month - 1, day, 23, 59, 59); // Set the end date to the end of the selected day
    console.log(startDate,endDate)
      for (let hour = 0; hour < 24; hour++) {
        const hourStartDate = new Date(year, month - 1, day, hour, 0, 0);
        const hourEndDate = new Date(year, month - 1, day, hour, 59, 59);
        console.log(hourStartDate, hourEndDate);
    
        const sales = await Sales.findOne({
          where: {
            creation: {
              [Op.between]: [hourStartDate, hourEndDate], // Filter sales within the current hour
            },
          },
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('sum', sequelize.col('total_inc_vat')), 0), 'total'], // Calculate the sum of 'total' for the hour, use 0 if null
          ],
        });
        const total = sales.dataValues.total;
        const hourLabel = `${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:59`;
        Sale.push({ date: hourLabel, sum: total });
      }
    }


    const salesCount = await Sales.count({
      where: {full_name: {[Op.not]: ''}}
    });
    const customerCount = await Customer.count({
      where: {full_name: {[Op.not]: ''}}
    });
    
    const branchCount = await Branch.count({
      where: {branch_name: {[Op.not]: ''}}
    });
    
    const productCount = await Product.count({
      where: {description: {[Op.not]: '' }}
    });
    const organizationCount = await Organization.count({
      where: { organization_type: { [Op.not]: ''}}
    });

    const activeCustomerCount = await Sales.count({
      distinct: true,
      col: 'id_number',
      where: {full_name: {[Op.not]: ''}}
    });

    // const totalPrice = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const result = await Sales.sum('total_inc_vat', {
      where: {full_name: {[Op.not]: ''}}
    });
    const totalPrice = parseFloat(result || 0);

    res.status(200).json({success: true,dashboardCount:{totalPrice,activeCustomerCount,salesCount,customerCount,branchCount,productCount,organizationCount},sales:Sale,});
}catch(err){
  console.log(err)
  return res.status(500).json({success: false,message: 'Server error.', error:err.message});
}
}


//show all sales attachement only
exports.showPaginatedSales = async (req, res) => {
  try{
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="sales";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("viewed sales data", req.user.email );
    }
    const { page, limit } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const salesCount = await Sales.count({
      where: { full_name: { [Op.not]: '' },},
    });
    const sales = await Sales.findAll({
      where: { full_name: { [Op.not]: '' },},
      attributes: ['name' ,'full_name' ,'id_number','customer_subcity','customer_woreda' ,'item_code','description','uom','quantity','unit_price','total_price','total','total_for_vat_items',
          'vat','total_inc_vat','prepared','cashier_full_name', 'creation'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    const totalPages = Math.ceil(salesCount / pageSize);
    res.status(200).json({success: true,sales,pagination: {
      total: salesCount,
      page: pageNumber,
      pageSize,
      totalPages,
    },});
}catch(err){
  console.log(err)
  return res.status(500).json({success: false,message: 'Server error.', error:err.message});
}
}




//show a sales data
exports.sale = async (req, res) => {
  // const {full_name,id_number,item_code,uom,quantity,unit_price} = req.body;
  const {id_number} = req.query; 
  if( !id_number){
    res.status(400).json({success: false,message: 'Please add customer id_number. '});
  }
  try{
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="sales";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("viewed a sale data", req.user.email );
    }
    const sales = await Sales.findAll({where: {id_number}, attributes: ['name' ,'full_name' ,'id_number','customer_subcity','customer_woreda' ,'item_code','description','uom','quantity','unit_price','total_price','total','total_for_vat_items',
    'vat','total_inc_vat','prepared','cashier_full_name', 'creation',]});
    if(!sales || sales.length === 0){
      return res.status(404).json({success:false,message: `This customer '${id_number}' has not bought any product(sales not found!).`})
    }
    // await userActivity("viewed a sale data", req.user.email );
    res.status(200).json({success: true,salesNumber:sales.length,sales});
  }catch (err) {
    console.error(err);
    res.status(500).json({success: false,message: 'Server error',error:err.message});
  }
}






//delete sales data
exports.deleteSales = async (req, res, next) => {
    const { full_name, item_code , id_number,uom,quantity,unit_price,total_price,total,cashier_full_name} = req.query;
    try {
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="sales";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity("deleted sales data", req.user.email );
      }
      if(!full_name || !id_number || !item_code || !uom || !quantity || !unit_price){
        return res.status(401).json({success:false, message: 'Please provide sales detail.' }); 
      }
      const sales = await Sales.findOne({ where: {item_code, id_number, unit_price, full_name, uom, quantity }, });
      if (!sales) {
        return res.status(404).json({ message: `${full_name} not found or has been deleted before` });
      }
        await sales.destroy()
        // await userActivity("deleted sales data", req.user.email );
        res.status(200).json({success: true,message: 'Successfully deleted.',});
        
    } catch (err) {
      console.error(err);
      res.status(500).json({success: false,message: 'Server error',error:err.message});
    }
  };






    //sales data update
    exports.updateSales = async (req, res, next) => {
      const {full_name,uom,item_code,id_number,quantity,unit_price, newFull_name, newName, newitem_code, newdescription,newUOM, newquantity, newunit_price,newVAT, newtotal } = req.body;
      try {
        if(req.user.email !== undefined && !req.user.roles.includes('admin')){
          const role="sales";
          const rp = await RP.findOne({where: {role}});
          const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
          // console.log(hasReadPermission);
          if(hasReadPermission !== true){
            return res.status(402).json({success: false,message:'Have no permission.' });
          }
          await userActivity("updated sales data", req.user.email );
        }
          if(!full_name || !id_number || !item_code || !uom || !quantity || !unit_price){
             return res.status(401).json({sccess:false, message: 'Please provide sales detail.' }); 
           }
          const sales = await Sales.findOne({where: { item_code, id_number, unit_price, full_name, uom, quantity }});
          if (!sales) {
            return res.status(404).json({ message: 'sales not found or deleted before.' });
          }
          if (newFull_name && newFull_name !== sales.full_name) {
              sales.full_name = newFull_name;
          }
          if (newName && newName !== sales.name) {
            sales.name= newName;
          }
          if (newitem_code && newitem_code !== sales.item_code) {
              sales.item_code= newitem_code;
            }
          if (newdescription && newdescription !== sales.description) {
              sales.description= newdescription;
          }
          if (newUOM && newUOM !== sales.uom) {
              sales.uom= newUOM;
          }
          if (newquantity && newquantity !== sales.quantity) {
              sales.quantity= newquantity;
          }
          if (newunit_price && newunit_price !== sales.unit_price) {
            sales.unit_price= newunit_price;
          }
          if (newVAT && newVAT !== sales.vat) {
            sales.vat= newVAT;
          }
          if (newtotal && newtotal !== sales.total) {
            sales.total= newtotal;
          }
          await sales.save();
          // await userActivity("updated sales data", req.user.email );
          res.status(200).json({ message: 'Sales updated successfully',sales});
        } catch (err) {
          console.error(err);
          res.status(500).json({success: false,message: 'Server error',error:err.message});
        }
      };
  
  
  

      // exports.updateSales = async (req, res, next) => {
      //   const updates = req.body;
      //   console.log(updates)
      //   if(!updates.full_name || !updates.id_number || !updates.item_code || !updates.uom || !updates.quantity || !updates.unit_price){
      //     return res.status(401).json({success:false, message: 'Please provide sales detail.' }); 
      //   }
      //   try {
      //     const sales = await Sales.findOne({ where: { full_name: updates.full_name, id_number: updates.id_number, uom: updates.uom, item_code: updates.item_code, quantity:updates.quantity, unit_price: updates.unit_price } });
      //     if (!sales) {
      //       return res.status(404).json({ message: 'Sales not found or deleted before.' });
      //     }
      //     Object.assign(sales, updates);
      //     await sales.save();
      //     await userActivity("updated sales data", req.user.email);
      //     res.status(200).json({ message: 'Sales updated successfully', sales });
      //   } catch (err) {
      //     next(err);
      //   }
      // };


  
      
  let fileNameCounter = 1;
  
  // Export data with CSV
  exports.exportSalesCSV = async (req, res) => {
    try {
      const attributes = req.body.attributes;
      if (!Array.isArray(attributes)) {
        return res.status(400).json({success: false,message: 'Invalid attributes provided, Please check attribute name.',});
      }
      const columnNames = Object.keys(Sales.rawAttributes);
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      const attributeTitles = filteredColumnNames.map(column => Sales.rawAttributes[column].field || column);

      const fileName = `Sales-Title${fileNameCounter}.csv`;
      fileNameCounter++;
      const filePath = path.join(os.homedir(), 'Downloads', fileName);   
  
      await createCSV(attributeTitles, filePath);
      res.download(filePath, fileName);
      res.status(200).json({success: true,message: 'Successfully Downloaded a new CSV file.',});
    } catch (error) {
      console.error(error);
      res.status(500).json({success: false,message: 'Server error',});
    }
  };
  
    function createCSV(attributeTitles, filePath) {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: attributeTitles.map((title, index) => ({ id: `col${index}`, title })),
    });
    return csvWriter.writeRecords([])
        .then(() => { console.log('CSV file written successfully');})
        .catch((error) => { console.error(error);
        throw error; });
  }
  
  
  // Export data with Excel
  exports.exportSalesExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Sales.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Sales.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
    const fileName = `Company-Title${fileNameCounter}.xlsx`; //generated excel file
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);

    await createExcel(attributeTitles, filePath);  //you need to uncomment if you want to download file to local 'downloads'.
    // if(req.user.email !== undefined){
    //   await userActivity("imported company data", req.user.email );
    // }
    res.download(filePath, fileName);  //you need to uncomment if you want to download file to local 'downloads'.
    res.status(200).json({ success: true, message: 'Successfully Show/Downloaded a new Excel file.',attributeTitles });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false,message: 'Server error',error:error.message});
  }
};
  
  
  // // Export data with Excel
  // exports.exportSalesExcel = async (req, res) => {
  //   try {
  //     const attributes = req.body.attributes;
  //     if (!Array.isArray(attributes)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Invalid attributes provided.',
  //       });
  //     }
  //     const columnNames = Object.keys(Sales.rawAttributes);
  //     const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
  //     const attributeTitles = filteredColumnNames.map(column => Sales.rawAttributes[column].field || column);
  //     console.log(attributeTitles)
  
  //     const fileName = `Sales-Title${fileNameCounter}.xlsx`;
  //     fileNameCounter++;
  //     const filePath = path.join(os.homedir(), 'Downloads', fileName);
  
  //     await createExcel(attributeTitles, filePath);
  //     res.download(filePath, fileName);
  //     res.status(200).json({success: true,message: 'Successfully Downloaded a new Excel file.',});
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({success: false,message: 'Server error',});
  //   }
  // };
  
  function createExcel(attributeTitles, filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    worksheet.addRow(attributeTitles);
  
    return workbook.xlsx.writeFile(filePath)
      .then(() => {
        console.log('Excel file written successfully');})
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }
  
  
  

  const generateSalesExcel = async (req, res, next) => {
    try {
      const salesData = await Sales.findAll();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Data');
      const tableHeaders = ['ID', 'Name', 'Full Name', 'Id Number', 'Customer Subcity', 'Customer woreda', 'Item Code', 'Description', 'UOM', 'Quantity', 'Unit Price', 'Total', 'Total for VAT Items', 'VAT', 'Total INC VAT', 'Prepared', 'Cashier Full Name'];
      worksheet.addRow(tableHeaders);

      for (const sales of salesData) {
        let rowData = [
          sales.id.toString(),sales.name,sales.full_name ,sales.id_number,sales.customer_subcity,sales.customer_woreda ,sales.item_code,
          sales.description,sales.uom,sales.quantity.toString(),sales.unit_price.toString(),sales.total.toString(),sales.total_for_vat_items.toString(),
          sales.vat.toString(),sales.total_inc_vat.toString(),sales.prepared,sales.cashier_full_name];
        worksheet.addRow(rowData);
      }
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      return workbook;
    } catch (error) {
      console.error(error);
      res.status(500).json({success: false,message: 'Server error',});
    }
  };
  


  // Print Excel
  exports.printSalesExcel = async (req, res) => {
    try {
      const workbook = await generateSalesExcel();
      const pdfDoc = await workbook.xlsx.writeBuffer();
      const fileName = `Sales-Data-${fileNameCounter}.xlsx`;
      fileNameCounter++;
      const filePath = path.join(os.homedir(), 'Downloads', fileName);
      // if (os.platform() === 'win32') {
      //   filePath = path.join(os.homedir(), 'Downloads',fileName);
      // } else {
      //   filePath = '/root/Downloads';
      // }
  
      fs.writeFileSync(filePath, pdfDoc);
      res.status(200).json({success: true,message: 'Successfully downloaded Excel.',});
    } catch (error) {
      console.error(error);
      res.status(500).json({success: false,message: 'Server error',});
    }
  };

  
  
  
  
  //sharePDF with email
  exports.shareEmailSales = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({success:false, message: 'Sales name is required in the request body' });
      }
    try {
    const workbook = await generateSalesExcel();
    const pdfBuffer = await workbook.xlsx.writeBuffer();
    const fileName = `Sales-Data-${fileNameCounter}.xlsx`;
    fileNameCounter++;
  
    shareWithEmail(email, pdfBuffer, fileName)
    .then(() => {
      res.status(200).json({success: true,message: `Successfully Shared a file to ${email}.`,});
    })
   }catch (error) {
      console.error(error);
      res.status(500).json({success: false,message: 'Server error',});
   }
   };
  
  
  
  
  
  
   

  
  
    //import data
  exports.importSalesData = async (req, res) => {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ success: false, message: 'file is required in the request body' });
    }
    try {
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="sales";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "import" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity("imported sales data", req.user.email )
      }
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/csv' ) {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
      
              const workbook = xlsx.readFile(file.path);
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              // const importedData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
              const data = xlsx.utils.sheet_to_json(worksheet);
              const check =await processAndInsertData(data);
              fs.unlinkSync(file.path);
              if(check){
                return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
              }else{
                return res.status(403).json({ success: false, message: 'No data imported.' ,check});
              }
      
            } else if (file.mimetype === 'text/csv') {
              let data=[] ;
              fs.createReadStream(file.path).pipe(csv())
                .on('data', (row) => {data.push(row);})
                .on('end', async () => {
                  const check= await processAndInsertData(data);
                  console.log('new',check)
                  fs.unlinkSync(file.path);
                  if(check){
                    return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
                  }else{
                    return res.status(403).json({ success: false, message: 'No data imported.' ,check});
                  }
                });
            };
        // await userActivity("imported sales data", req.user.email )
        // return res.status(200).json({ success: true, message: 'Data imported successfully' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid file format' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

  
  async function processAndInsertData(data) {
    let check=false;
    if (data.length === 0) {
      console.log('No data to process.');
      return; 
    }
    for (const row of data) {
      const {full_name, description, uom, quantity, total_price,total_inc_vat} = row;
      try {
        if(!full_name || !uom || !description || !total_inc_vat || !quantity){
          // console.log(`Skipping sales ${description}!`);
          continue;
        }
        const existingSales = await Sales.findOne({ where: { full_name, description, uom, quantity, total_inc_vat } });
        if (existingSales) {
          // console.log('Sales already exists in the database.');
        } else {
          // console.log(`Sales does not exist in the database. Proceed with storing it.`);
          await Sales.create(row);
          check=true;
        }
      } catch (error) {
        console.error('Error processing and inserting data for Sales', error);
      }console.log(check)
    }return check
}