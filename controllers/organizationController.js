const axios = require('axios');
const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const ErrorResponse = require('../utilis/errorResponse');
const Organization = require('../models/organizationModel')(sequelize, DataTypes);
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
const cron = require('node-cron');
const userActivity = require('../utilis/userActivity');
const { createNotification } = require('./notificationController');
const RP = require('../models/rpModel')(sequelize, DataTypes);




// schedule.scheduleJob('0 0 */12 * *', async () => {
  let limit_start=1;
  const limit_page_length=100;
  const {password, oURL}=process.env;

  async function fetchDataAndStore() {
    try {
      organURL = `${oURL}limit_page_length=${limit_page_length}&limit_start=${limit_start}&password=${password}`;
      // console.log(organURL, limit_start, limit_page_length);
      // limit_start += limit_page_length;
      // console.log(organURL, limit_start, limit_page_length);
      const response = await axios.get(organURL);
      const data = response.data.data;

      // limit_start += data.length;
      // console.log(limit_start, limit_page_length);

      await processAndInsertData(data);

      limit_start += data.length;
      // console.log(limit_start, limit_page_length);
  
      console.log('Successfully fetched and stored.');
      } catch (error) {
      console.error('Error on scraping/storing data:', error);
      await createNotification('Error on fetching and storing organization data', `An error occurred while fetching and storing organization data. Error: ${error}`,'techethio@etyop.com')
      }
  }
  // Schedule the initial fetching and storing of data
  fetchDataAndStore();
  
  const job = schedule.scheduleJob('0 5,17 * * *', fetchDataAndStore);//every 5pm and 5am
  // const job1 = schedule.scheduleJob('0 0 * * *', fetchDataAndStore); // 12:00 AM
  // const job2 = schedule.scheduleJob('0 18 * * *', fetchDataAndStore); // 6:00 PM
  // const job = schedule.scheduleJob('*/1 * * * *', fetchDataAndStore);//every minute




exports.organizationData = async (req, res, next) => {
  try {
    const response = await axios.get(process.env.organURL);
    const data = response.data.data;
    await processAndInsertData(data);

    res.status(200).json({
      success: true,
      message: 'Successfully scraped/fetched, and stored data.',
      data
    });
  } catch (error) {
    console.error('Error on scraping/storing data:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
// )


//show all organization data
exports.showOrganization = async (req, res) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = 'organ';
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(
        (permission) => permission.permission === 'read' && permission.granted === true
      );
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity('viewed an organization data', req.user.email);
    }

    // Pagination parameters
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const organizationsCount = await Organization.count({ where: { organization_type: { [Op.not]: '' } } });
    const totalPages = Math.ceil(organizationsCount / pageSize);

    const organizations = await Organization.findAll({
      where: { organization_type: { [Op.not]: '' } },
      attributes: ['organization_type', 'name1', 'phone', 'email', 'address', 'subcity', 'woreda', 'house_number'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    res.status(200).json({
      success: true,
      organizations,
      pagination: {
        total: organizationsCount,
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


// //show all organization data
// exports.showOrganization = async (req, res) => {
//   try{
//     if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//       const role="organ";
//       const rp = await RP.findOne({where: {role}});
//       const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//       // console.log(hasReadPermission);
//       if(hasReadPermission !== true){
//         return res.status(402).json({success: false,message:'Have no permission.' });
//       }
//       await userActivity("viewed an organization data", req.user.email );
//     }
//       const organizations = await Organization.findAll({ where: { organization_type: { [Op.not]: ''}}, 
//       attributes: ['organization_type','name1','phone','email','address','subcity','woreda','house_number']  });
//       // await userActivity("viewed an organization data", req.user.email );
//       res.status(200).json({success: true,organizations});
//   }catch (err) {
//     console.error(err);
//     res.status(500).json({success: false,message: 'Server error',error:err.message});
//   }
// };






//show a organization data
exports.organization = async (req, res) => {
  // const {organization_type} = req.body;
  const {organization_type}=req.query;
  if(!organization_type){
    return res.status(400).json({success: false,message: 'Please provide organization detail.'});
  }
  try{
    if(req.user.email !== undefined && !req.user.roles.includes('admin')){
      const role="organ";
      const rp = await RP.findOne({where: {role}});
      const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
      // console.log(hasReadPermission);
      if(hasReadPermission !== true){
        return res.status(402).json({success: false,message:'Have no permission.' });
      }
      await userActivity("viewed organization data", req.user.email );
    }
  const organization = await Organization.findOne({where: {organization_type},attributes: ['organization_type','name1','phone','email','address','subcity','woreda','house_number'] });
  // await userActivity("viewed organization data", req.user.email );
  res.status(200).json({success: true,organization});
}catch(err){
  console.log(err);
  return res.status(500).json({success:false, message: 'Server Error.', error: err.message });
}
}






//delete organ data
exports.deleteOrgan = async (req, res, next) => {
    const { organization_type} = req.query;
    if(!organization_type){
      return res.status(400).json({success: false,message: 'Please provide organization detail.'});
    }
    try {
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="organ";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity("deleted organization data", req.user.email );
      }
      const organ = await Organization.findOne({ where: { organization_type }  });
      if (!organ) {
        return res.status(404).json({ message: `${organization_type} not found or has been deleted before` });
      }
      await organ.destroy();
      // await userActivity("deleted organization data", req.user.email );
      res.status(200).json({success: true,message: 'Successfully deleted.', });
    } catch (err) {
      console.log(err);
      res.status(500).json({success: false,message: err.message,});
    }
  };






    //customer profile update
    exports.updateOrgan = async (req, res, next) => {
      const { organization_type,newOrganization,newName,newPhone,newEmail,newAddress,newWoreda,newSubcity,newHouse_number} = req.body;
      if(!organization_type){
        return res.status(400).json({success: false,message: 'Please provide organization detail.'});
      }
      try {
        if(req.user.email !== undefined && !req.user.roles.includes('admin')){
          const role="organ";
          const rp = await RP.findOne({where: {role}});
          const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
          // console.log(hasReadPermission);
          if(hasReadPermission !== true){
            return res.status(402).json({success: false,message:'Have no permission.' });
          }
          await userActivity("updated organization data", req.user.email );
        }
          const organ = await Organization.findOne({where: { organization_type }});
          if (!organ) {
            return res.status(404).json({ message: 'sales not found or deleted before.' });
          }
          if (newOrganization && newOrganization !== organ.organization_type) {
              organ.organization_type = newOrganization;
          }
          if (newName && newName !== organ.name) {
            organ.name= newName;
          }
          if (newPhone && newPhone !== organ.newPhone) {
              organ.newPhone= newPhone;
            }
          if (newEmail && newEmail !== organ.email) {
              organ.email= newEmail;
          }
          if (newAddress && newAddress !== organ.address) {
              organ.address= newAddress;
          }
          if (newWoreda && newWoreda !== organ.woreda) {
              organ.woreda= newWoreda;
          }
          if (newSubcity && newSubcity !== organ.subcity) {
            organ.subcity= newSubcity;
          }
          if (newHouse_number && newHouse_number !== organ.house_number) {
            organ.house_number= newHouse_number;
          }
          await organ.save();
          // await userActivity("updated organization data", req.user.email );
          res.status(200).json({success:true, message: 'Sales updated successfully',organ});
        } catch (err) {
          console.error(err);
          res.status(500).json({success: false,message: 'Server error',error:err.message});
        }
      };
  
  
  


  
      
  let fileNameCounter = 1;
  
  // Export data with CSV
  exports.exportOrganCSV = async (req, res) => {
    try {
      const attributes = req.body.attributes;
  
      if (!Array.isArray(attributes)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attributes provided, Please check attribute name.',
        });
      }
      const columnNames = Object.keys(Organization.rawAttributes);
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      const attributeTitles = filteredColumnNames.map(column => Organization.rawAttributes[column].field || column);

      const fileName = `Organization-Title${fileNameCounter}.csv`;
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
  exports.exportOrganExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Organization.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Organization.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
    const fileName = `Company-Title${fileNameCounter}.xlsx`; //generated excel file
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);

    await createExcel(attributeTitles, filePath);  //you need to uncomment if you want to download file to local 'downloads'.
    // if(req.user.email !== undefined){
    //   await userActivity("imported organization data", req.user.email );
    // }
    res.download(filePath, fileName);  //you need to uncomment if you want to download file to local 'downloads'.
    res.status(200).json({ success: true, message: 'Successfully Show/Downloaded a new Excel file.',attributeTitles });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false,message: 'Server error',error:error.message});
  }
};
  
  
  // // Export data with Excel
  // exports.exportOrganExcel = async (req, res) => {
  //   try {
  //     const attributes = req.body.attributes;
  //     if (!Array.isArray(attributes)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Invalid attributes provided.',
  //       });
  //     }
  //     // const attributeTitles = attributes.map(attribute => Organization.rawAttributes[attribute].field || attribute);
  //     const columnNames = Object.keys(Organization.rawAttributes);
  //     const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
  //     const attributeTitles = filteredColumnNames.map(column => Organization.rawAttributes[column].field || column);
  //     console.log(attributeTitles)
  
  //     const fileName = `Organization-Title${fileNameCounter}.xlsx`;
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
  
  
  

  const generateOrganExcel = async (req, res, next) => {
    try {
      const organData = await Organization.findAll();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Organization Data');
      const tableHeaders = ['Organization Type','Name','Phone','Email','Address','Subcity','Woreda','House Number'];
      worksheet.addRow(tableHeaders);

      for (const organ of organData) {
        let rowData = [
          organ.organization_type,
          organ.name1 ,
          organ.phone,
          organ.email,
          organ.address ,
          organ.subcity,
          organ.woreda,
          organ.house_number,
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
  exports.printOrganExcel = async (req, res) => {
    try {
      const workbook = await generateOrganExcel();
      const pdfDoc = await workbook.xlsx.writeBuffer();
      const fileName = `Organization-Data-${fileNameCounter}.xlsx`;
      fileNameCounter++;
      const filePath = path.join(os.homedir(), 'Downloads', fileName);
      // if (os.platform() === 'win32') {
      //   filePath = path.join(os.homedir(), 'Downloads',fileName);
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
  exports.shareEmailOrgan = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Sales name is required in the request body' });
      }
    try {
    const workbook = await generateOrganExcel();
    const pdfBuffer = await workbook.xlsx.writeBuffer();
    const fileName = `Organization-Data-${fileNameCounter}.xlsx`;
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
  exports.importOrganData = async (req, res) => {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ success: false, message: 'file is required in the request body' });
    }
    try {
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="organ";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "import" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity("imported organization data", req.user.email );
      }
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/csv' ) {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
      
              const workbook = xlsx.readFile(file.path);
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              // const importedData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
              const data = xlsx.utils.sheet_to_json(worksheet);
              const check = await processAndInsertData(data);
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
                const check = await processAndInsertData(data);
                fs.unlinkSync(file.path); 
                if(check){
                  return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
                }else{
                  return res.status(403).json({ success: false, message: 'No data imported.' ,check});
                }
              });
            };
        // await userActivity("imported organization data", req.user.email );
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
          return; }
    for (const row of data) {
      const {name1, creation} = row;
      try {
        if(!name1){
          // console.log(`Skipping organization ${name1}!`);
          continue;
        }
        const existingOrg = await Organization.findOne({ where: { name1, } });
        if (existingOrg) {
          // console.log('Organ already exists in the database.');
        } else {
          // console.log(`Organ does not exist in the database. Proceed with storing it.`);
          await Organization.create(row);
          check=true
        }
      } catch (error) {
        console.error('Error processing and inserting data for Sales', error);
      }console.log(check)
    }return check
}