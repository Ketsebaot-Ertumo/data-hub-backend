const axios = require('axios');
const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const ErrorResponse = require('../utilis/errorResponse');
const Product = require('../models/productModel')(sequelize, DataTypes);
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




  let limit_start=1;
  const limit_page_length=250;
  const {password, pURL}=process.env;

  async function fetchDataAndStore() {
    try {
      productURL = `${pURL}limit_page_length=${limit_page_length}&limit_start=${limit_start}&password=${password}`;
      // console.log(productURL, limit_start, limit_page_length);
      // limit_start += limit_page_length;
      // console.log(productURL, limit_start, limit_page_length);
      const response = await axios.get(productURL);
      const data = response.data.data;

      // limit_start += data.length;
      // console.log(limit_start, limit_page_length);

      await processAndInsertData(data);

      limit_start += data.length;
      // console.log(limit_start, limit_page_length);
  
      console.log('Successfully fetched and stored.');
    } catch (error) {
      console.error('Error on scraping/storing data:', error);
      await createNotification('Error on fetching and storing product data', `An error occurred while fetching and storing product data. Error: ${error}`,'techethio@etyop.com')
    }
  }
  // Schedule the initial fetching and storing of data
  fetchDataAndStore();

  // const job = schedule.scheduleJob('0 5,17 * * *', fetchDataAndStore);//every 5pm and 5am
  // const job1 = schedule.scheduleJob('0 0 * * *', fetchDataAndStore); // 12:00 AM
  // const job2 = schedule.scheduleJob('0 18 * * *', fetchDataAndStore); // 6:00 PM
  const job = schedule.scheduleJob('*/1 * * * *', fetchDataAndStore);//every minute



//cron.schedule('0 0 */12 * *', async () => {
exports.productData = async (req, res, next) => {
  try {
    const response = await axios.get(process.env.productURL);
    const data = response.data.data;
    await processAndInsertData(data);

    res.status(200).json({success: true,message: 'Successfully scraped/fetched, and stored data.',data});
  } catch (error) {
    console.error('Error on scraping/storing data:', error);
    res.status(500).json({success: false,message: 'Error on scraping and storing data',error:err.message});
  }
}



exports.showProducts = async (req, res) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = "product";
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity("viewed product data.", req.user.email);
    }

    const { page, limit } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const productsCount = await Product.count({ where: { description: { [Op.not]: '' } } });

    const totalPages = Math.ceil(productsCount / pageSize);

    const products = await Product.findAll({
      where: { description: { [Op.not]: '' } },
      attributes: ['kenema_pharmacy_drug_shop_number', 'description', 'item_code', 'unit', 'brand', 'pharmacological_category', 'manufacturer', 'batch_number', 'exp_date', 'vat', 'quantity', 'unit_selling_price', 'total_selling_price'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product data not found." });
    }

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total: productsCount,
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



// //show all product attachement
// exports.showProducts = async (req, res) => {
//   try{
//     if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//       const role="product";
//       const rp = await RP.findOne({where: {role}});
//       const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//       // console.log(hasReadPermission);
//       if(hasReadPermission !== true){
//         return res.status(402).json({success: false,message:'Have no permission.' });
//       }
//       await userActivity("viewed product data.", req.user.email );
//     }
//     const Products = await Product.findAll({ where: { description: { [Op.not]: ''}}, 
//     attributes: ['kenema_pharmacy_drug_shop_number','description','item_code','unit','brand','pharmacological_category' ,'manufacturer','batch_number', 'exp_date','vat','quantity','unit_selling_price','total_selling_price']});
//     // await userActivity("viewed product data.", req.user.email );
//     res.status(200).json({success: true,  Products});
//   }catch(err){
//     console.log(err);
//     res.status(500).json({success: false,message: 'Error on scraping and storing data',error:err.message});
// }
// }






//show a product data
exports.product = async (req, res) => {
  // const {kenema_pharmacy_drug_shop_number, description, unit,brand} = req.body;
  const {item_code, batch_number,unit,brand,unit_selling_price,quantity,exp_date} = req.query;
  if(!item_code || !batch_number || !unit || !brand || !unit_selling_price || !quantity || !exp_date){
    return res.status(400).json({success: false,message: 'Please product detail.'});
  }
  try{
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="product";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("viewed product data.", req.user.email );
    }
    const product = await this.Product.findOne({where: {item_code, batch_number,unit,brand,unit_selling_price,quantity,exp_date},attributes: ['kenema_pharmacy_drug_shop_number','description','item_code','unit','address','brand','pharmacological_category','manufacturer','batch_number', 'exp_date','vat','quantity','unit_selling_price','total_selling_price'] });
    // await userActivity("viewed product data.", req.user.email );
    res.status(200).json({success: true,product});
  }catch(err){
    console.log(err)
    return res.status(500).json({success: false,message: 'Server error.',error:err.message});
}
}





//delete product data
exports.deleteProduct = async (req, res, next) => {
  const { item_code, batch_number,unit,brand,unit_selling_price,quantity,exp_date} = req.query;
  if(!item_code || !batch_number || !unit || !brand || !unit_selling_price || !quantity || !exp_date){
      return res.status(400).json({success: false,message: 'Please product detail.'});
    }
  try {
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="product";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("deleted product data ", req.user.email );
    }
    const product = await Product.findOne({ where: { item_code, batch_number,unit,brand,unit_selling_price,quantity,exp_date }, });
    if (!product) {
      return res.status(404).json({ message: 'product not found or has been deleted before' });
    }
    await product.destroy()
    // await userActivity("deleted product data ", req.user.email );
    res.status(200).json({success: true, message: 'Successfully deleted.', });
  } catch (err) {
    console.error(err);
    res.status(500).json({success: false,message: 'Server error',error:err.message});
  }
};






    //product profile update
    exports.updateProduct = async (req, res, next) => {
      const { item_code, batch_number,unit,brand,unit_selling_price,quantity,exp_date} = req.body;
      if(!item_code || !batch_number || !unit || !brand || !unit_selling_price || !quantity || !exp_date){
        return res.status(400).json({success: false,message: 'Please product detail.'});
      }
      try {
        if(req.user.email !== undefined && !req.user.roles.includes('admin')){
          const role="product";
          const rp = await RP.findOne({where: {role}});
          const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
          // console.log(hasReadPermission);
          if(hasReadPermission !== true){
            return res.status(402).json({success: false,message:'Have no permission.' });
          }
          await userActivity("updated product data.", req.user.email );
        }
          const product = await Product.findOne({where: { item_code, batch_number,unit,brand,unit_selling_price,quantity,exp_date }});
          if (!product) {
            return res.status(404).json({ message: 'product not found or deleted before.' });
          }
          if (newNumber && newNumber !== product.kenema_pharmacy_drug_shop_number) {
              product.kenema_pharmacy_drug_shop_number = newNumber;
          }
          if (newDescription && newDescription !== product.description) {
            product.description= newDescription;
          }
          if (newItem_code && newItem_code !== product.item_code) {
              product.item_code= newItem_code;
            }
          if (newUnit && newUnit !== product.unit) {
              product.unit= newUnit;
          }
          if (newBrand && newBrand !== product.newBrand) {
              product.brand= newBrand;
          }
          if (newBatch_number && newBatch_number !== product.batch_number) {
              product.batch_number= newBatch_number;
          }
          if (newQuantity && newQuantity !== product.quantity) {
            product.quantity= newQuantity;
          }
          if (newSelling && newSelling !== product.unit_selling_price) {
            product.unit_selling_price= newSelling;
          }
          if (newTotal && newTotal !== product.total_selling_price) {
            product.total_selling_price= newTotal;
          }
          await product.save();
          // await userActivity("updated product data.", req.user.email );
          res.status(200).json({success:true, message: 'Sales updated successfully', product});
        } catch (err) {
          console.error(err);
          res.status(500).json({success: false,message: 'Server error',error:err.message});
        }
      };
  
  
  


  
      
  let fileNameCounter = 1;
  
  // Export data with CSV
  exports.exportProductCSV = async (req, res) => {
    try {
      const attributes = req.body.attributes;
  
      if (!Array.isArray(attributes)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attributes provided, Please check attribute name.',
        });
      }
      const columnNames = Object.keys(Product.rawAttributes);
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      const attributeTitles = filteredColumnNames.map(column => Product.rawAttributes[column].field || column);

      const fileName = `Product-Title${fileNameCounter}.csv`;
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
        message: 'Server error',
      });}
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
  exports.exportProductExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Product.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Product.rawAttributes[column].field || column);
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
  // exports.exportProductExcel = async (req, res) => {
  //   try {
  //     const attributes = req.body.attributes;
  //     if (!Array.isArray(attributes)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Invalid attributes provided.',
  //       });
  //     }
  //     // const attributeTitles = attributes.map(attribute => Organization.rawAttributes[attribute].field || attribute);
  //     const columnNames = Object.keys(Product.rawAttributes);
  //     const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
  //     const attributeTitles = filteredColumnNames.map(column => Product.rawAttributes[column].field || column);
  //     console.log(attributeTitles)
  
  //     const fileName = `Product-Title${fileNameCounter}.xlsx`;
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
  //       message: 'Server error',
  //     });}
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
  
  
  

  const generateProductExcel = async (req, res, next) => {
    try {
      const productData = await Product.findAll();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Product Data');
      const tableHeaders = ['Kenema Pharmacy','Description','Item Code','Unit','Brand','Manufacturer','Batch Number','Expire Date', 'VAT', 'Quantity', 'Unity Selling Price', 'Total Selling Price'];
      worksheet.addRow(tableHeaders);

      for (const product of productData) {
        let rowData = [
          product.kenema_pharmacy_drug_shop_number,
          product.description ,
          product.item_code,
          product.unit,
          product.brand ,
          product.manufacturer,
          product.batch_number,
          product.exp_date,
          product.vat.toString(),
          product.quantity.toString(),
          product.unit_selling_price.toString(),
          product.total_selling_price.toString(),
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
        message: 'Server error',
      });
    }
  };
  


  // Print Excel
  exports.printProductExcel = async (req, res) => {
    try {
      const workbook = await generateProductExcel();
      const pdfDoc = await workbook.xlsx.writeBuffer();
      const fileName = `Product-Data-${fileNameCounter}.xlsx`;
      fileNameCounter++;
      const filePath = path.join(os.homedir(), 'Downloads', fileName);
      // if (os.platform() === 'win32') {
      //   filePath = path.join(os.homedir(), 'Downloads');
      // } else {
      //   filePath = '/root/Downloads';
      // }
  
      fs.writeFileSync(filePath, pdfDoc);
      res.status(200).json({
        success: true,
        message: 'Successfully downloaded Excel.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  };

  
  
  
  
  //sharePDF with email
  exports.shareEmailProduct = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Product name is required in the request body' });
      }
    try {
    const workbook = await generateProductExcel();
    const pdfBuffer = await workbook.xlsx.writeBuffer();
    const fileName = `Product-Data-${fileNameCounter}.xlsx`;
    fileNameCounter++;
  
    shareWithEmail(email, pdfBuffer, fileName)
    .then(() => {
      res.status(200).json({
        success: true,
        message: `Successfully Shared a file to ${email}.`,
      });
    })
   }catch (error) {
      console.error(error);
      res.status(500).json({
      success: false,
      message: 'Server error',
      });
   }
   };

  
  
  
  
    //import data
  exports.importProductData = async (req, res) => {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ success: false, message: 'file is required in the request body' });
    }
    try {
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="product";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "import" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity("imported product data.", req.user.email );
      }
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/csv' ) {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
      
              const workbook = xlsx.readFile(file.path);
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              // const importedData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
              const data = xlsx.utils.sheet_to_json(worksheet);
              check= await processAndInsertData(data);
              fs.unlinkSync(file.path);
              if(check){
                return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
              }else{
                return res.status(403).json({ success: false, message: 'No data imported.' ,check});
              }
      
            } else if (file.mimetype === 'text/csv') {
              let data=[] ;
              fs.createReadStream(file.path)
              .pipe(csv())
              .on('data', (row) => {
                data.push(row);
              })
              .on('end', async () => {
                check= await processAndInsertData(data);
                console.log('new',check)
                fs.unlinkSync(file.path);
                if(check){
                  return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
                }else{
                  return res.status(403).json({ success: false, message: 'No data imported.' ,check});
                }
              });
            };
        // await userActivity("imported product data.", req.user.email );
        // return res.status(200).json({ success: true, message: 'Data imported successfully' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid file format' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error', error:error.message});
    }
  };
  

  
  async function processAndInsertData(data) {
    let check=false;
    if (data.length === 0) {
          console.log('No data to process.');
          return;
        }
    for (const row of data) {
      const {kenema_pharmacy_drug_shop_number,description,brand,unit,exp_date, modified, batch_number, unit_selling_price, total_selling_price,quantity} = row;
      try {
        if(!brand || !unit || !exp_date || !batch_number || !unit_selling_price || !quantity ){
          // console.log(`Skipping product ${description}!`);
          continue;
        }
        const existingProduct = await Product.findOne({ where: { brand,unit,exp_date:exp_date.toString(),batch_number,quantity,unit_selling_price} });
        if (existingProduct) {
          // console.log('Product already exists in the database.');
        } else {
          // console.log(`Product does not exist in the database. Proceed with storing it.`);
          await Product.create(row);
          check=true;
        }
      } catch (error) {
        console.error('Error processing and inserting data for Product', error);
      }
    }return check
}