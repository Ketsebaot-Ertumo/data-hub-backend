const axios = require('axios');
const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const Branch = require('../models/branchModel')(sequelize, DataTypes);
const {shareWithEmail} = require('../utilis/sendEmail');
const  pdfMake = require('pdfmake');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const fs = require('fs');
const xlsx = require('xlsx');
const path =require('path');
const os = require('os');
const csv = require('csv-parser');
const schedule = require('node-schedule');
const userActivity = require('../utilis/userActivity');
const { createNotification } = require('./notificationController');
const RP = require('../models/rpModel')(sequelize, DataTypes);



// schedule.scheduleJob('0 0 */12 * *', async () => {
  let limit_start=1;
  const limit_page_length=50;
  const {password, bURL}=process.env;

  async function fetchDataAndStore() {
    try {
      branchURL = `${bURL}limit_page_length=${limit_page_length}&limit_start=${limit_start}&password=${password}`;
      // console.log(branchURL, limit_start, limit_page_length);
      // limit_start += limit_page_length;
      // console.log(branchURL, limit_start, limit_page_length);
      const response = await axios.get(branchURL);
      const data = response.data.data;

      await processAndInsertData(data);

      limit_start += data.length; //to stop if error occur when fetching
      // console.log(limit_start, limit_page_length);
  
      console.log('Successfully fetched and stored.');
     } catch (error) {
      console.error('Error on fetching/storing data:', error);
      await createNotification('Error on fetching and storing brach data', `An error occurred while fetching and storing branch data. Error: ${error}`,'techethio@etyop.com')
      }
  }
  // Schedule the initial fetching and storing of data
  fetchDataAndStore();

  const job = schedule.scheduleJob('0 5,17 * * *', fetchDataAndStore);//every 5pm and 5am
  // const job1 = schedule.scheduleJob('0 0 * * *', fetchDataAndStore); // 12:00 AM
  // const job2 = schedule.scheduleJob('0 18 * * *', fetchDataAndStore); // 6:00 PM
  // const job = schedule.scheduleJob('*/1 * * * *', fetchDataAndStore);//every minute




//fetching and storing for checking with end point
exports.BranchData = async (req, res, next) => {
  try {
        const response = await axios.get(process.env.branchURL);
        const data = response.data.data; 
        await processAndInsertData(data);

        res.status(200).json({success: true,message: 'Successfully Scraped/fetched and stored Data.',data});
       } catch (error) {
         console.error('Error on scraping and storing data:', error);
         res.status(500).json({success: false,message: 'Error on scraping and storing data', error,}); 
    }
  };



//show profile
exports.showBranchProfile = async (req, res) => {
  // const {branch_name} = req.body;
  const { branch_name,branch_number, } = req.query;
  if(!branch_name && !branch_number){
    res.status(400).json({success: false,message: 'Please add branch_name or branch_number'});
  }
  if(req.user.email !== undefined && !req.user.roles.includes('admin')){
    const role="branch";
    const rp = await RP.findOne({where: {role}});
    const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
    // console.log(hasReadPermission);
    if(hasReadPermission !== true){
      return res.status(402).json({success: false,message:'Have no permission.' });
    }
    await userActivity("viewed branch data", req.user.email );
  }
  const whereClause = {};
  if (branch_name) {
    whereClause.branch_name = branch_name;
  }
  if (branch_number) {
    whereClause.branch_number = branch_number;
  }
  const branch = await Branch.findOne({where: whereClause,attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number']});
  // await userActivity("viewed branch data", req.user.email );
  res.status(200).json({success: true,branch});
}


//show all branchs data
exports.showBranchs = async (req, res) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = 'branch';
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(
        (permission) => permission.permission === 'read' && permission.granted === true
      );
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity('viewed branchs data', req.user.email);
    }

    // Pagination parameters
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 41;

    const branchsCount = await Branch.count();
    const totalPages = Math.ceil(branchsCount / pageSize);

    const branchs = await Branch.findAll({
      attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    res.status(200).json({
      success: true,
      branchs,
      pagination: {
        total: branchsCount,
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


// //show all branchs data
// exports.showBranchs = async (req, res) => {
//   try{
//     if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//       const role="branch";
//       const rp = await RP.findOne({where: {role}});
//       const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//       // console.log(hasReadPermission);
//       if(hasReadPermission !== true){
//         return res.status(402).json({success: false,message:'Have no permission.' });
//       }
//       await userActivity("viewed branchs data", req.user.email );
//     }
//       const branchs = await Branch.findAll({attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number',]});
//       // await userActivity("viewed branchs data", req.user.email );
//       res.status(200).json({success: true, branchs });
//   }catch (err) {
//     console.error(err);
//     res.status(500).json({success: false,message: 'Server error',error:err.message});
//   }
// };



//delete branch data
exports.deleteBranch = async (req, res, next) => {
    const { branch_name } = req.query;
    try {
      const branch = await Branch.findOne({ where: { branch_name } });
      if (!branch) {
        return res.status(404).json({ message: 'Branch not found or has been deleted before' });
      }
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="branch";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity("deleted branch data", req.user.email );
      }
      await branch.destroy()
      // await userActivity("deleted branch data", req.user.email );
      res.status(200).json({success: true, message: 'Successfully deleted.', });
    } catch (err) {
      console.error(err);
      res.status(500).json({success: false,message: 'Server error',error:err.message});
    }
  };



  //branch profile update
  exports.updateBranchProfile = async (req, res, next) => {
    const {branch_name, newBranch_name, newBranch_number, newSubcity, newWoreda, newHouse_number, newEmail, newPhone_number} = req.body;
    try {
        const branch = await Branch.findOne({where: { branch_name }});
        if (!branch) {
          return res.status(404).json({ message: 'Branch not found or deleted before.' });
        }
        if(req.user.email !== undefined && !req.user.roles.includes('admin')){
          const role="branch";
          const rp = await RP.findOne({where: {role}});
          const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
          // console.log(hasReadPermission);
          if(hasReadPermission !== true){
            return res.status(402).json({success: false,message:'Have no permission.' });
          }
          await userActivity("updated branch data", req.user.email );
        }
        if (newBranch_name && newBranch_name !== branch.branch_name) {
            branch.branch_name = newBranch_name;
        }
        if (newBranch_number && newBranch_number !== branch.branch_number) {
            branch.branch_number = newBranch_number;
        }
        if (newSubcity && newSubcity !== branch.subcity) {
          branch.subcity= newSubcity;
        }
        if (newWoreda && newWoreda !== branch.woreda) {
            branch.woreda= newWoreda;
          }
        if (newHouse_number && newHouse_number !== branch.house_number) {
            branch.house_number= newHouse_number;
        }
        if (newEmail && newEmail !== branch.email) {
            branch.house_number= newHouse_number;
        }
        if (newPhone_number && newPhone_number !== branch.phone_number) {
            branch.phone_number= newPhone_number;
        }
        await branch.save();
        // await userActivity("updated branch data", req.user.email );
        res.status(200).json({success:true, message: 'Branch updated successfully', user });
      } catch (err) {
        console.error(err);
        res.status(500).json({success: false,message: 'Server error',error:err.message});
      }
    };




 
let fileNameCounter = 1;

// Export data with CSV
exports.exportBranchDataCSV = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Branch.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Branch.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
  
    const fileName = `Branch-Title${fileNameCounter}.csv`;
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
    .then(() => {
      console.log('CSV file written successfully');
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}


// Export data with Excel
exports.exportBranchDataExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Branch.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Branch.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
    const fileName = `Branch-Title${fileNameCounter}.xlsx`; //generated excel file
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);

    await createExcel(attributeTitles, filePath);  //you need to uncomment if you want to download file to local 'downloads'.
    res.download(filePath, fileName);  //you need to uncomment if you want to download file to local 'downloads'.
    // if(req.user.email !== undefined){
    //   await userActivity("imported company data", req.user.email );
    // }
    res.status(200).json({ success: true, message: 'Successfully Show/Downloaded a new Excel file.',attributeTitles });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false,message: 'Server error',error:error.message});
  }
};


// // Export data with Excel
// exports.exportBranchDataExcel = async (req, res) => {
//   try {
//     const attributes = req.body.attributes;

//     if (!Array.isArray(attributes)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid attributes provided.',
//       });
//     }

//     const columnNames = Object.keys(Branch.rawAttributes);
//     const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
//     const attributeTitles = filteredColumnNames.map(column => Branch.rawAttributes[column].field || column);

//     const fileName = `Branch-Title${fileNameCounter}.xlsx`;
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
//     res.status(500).json({success: false,message: 'Server error',error:error.message});
//   }
// };

function createExcel(attributeTitles, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  worksheet.addRow(attributeTitles);
  // return workbook;

  return workbook.xlsx.writeFile(filePath)
    .then(() => {
      console.log('Excel file written successfully');})
    .catch((error) => {
      console.error(error);
      throw error;
    });
}



//generate excel for branch data
const generateBranchPDF= async (req, res, next) => {
  try {
    const branchData = await Branch.findAll();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Branch Data');
    const tableHeaders = ['Branch Name', 'Branch Number', 'Subcity', 'Woreda', 'House Number', 'Email', 'Phone Number'];
    worksheet.addRow(tableHeaders);

    for (const branch of branchData) {
      let rowData = [
        branch.branch_name,
        branch.name1 ,
        branch.phone,
        branch.email,
        branch.address ,
        branch.subcity,
        branch.woreda,
        branch.house_number,
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
exports.printBranchDataPDF = async (req, res) => {
  try {
    const workbook = await generateBranchPDF();
    const pdfDoc = await workbook.xlsx.writeBuffer();
    const fileName = `Branch-Data-${fileNameCounter}.xlsx`;
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



// //generate PDF(common function)
//   const generateBranchPDF= async (req, res, next) => {
//     try {
//       const branchData = await Branch.findAll();
//       const fonts = {
//         Roboto: {
//           // normal: vfsFonts.pdfMake.vfs['Roboto-Regular.ttf'],
//           // bold: vfsFonts.pdfMake.vfs['Roboto-Bold.ttf'],
//           bold: 'C:\\Users\\PC\\Desktop\\TE-DATA-API\\Bold.ttf',
//           normal: 'C:\\Users\\PC\\Desktop\\TE-DATA-API\\Regular.ttf'
//         },
//      };
//     const tableHeaders = ['Branch Name', 'Branch Number', 'Subcity', 'Woreda', 'House Number', 'Email', 'Phone Number'];
//     const tableRows = branchData.map(branch => [
//       branch.branch_name,
//       branch.branch_number.toString(),
//       branch.subcity,
//       branch.woreda.toString(),
//       branch.house_number.toString(),
//       branch.email,
//       branch.phone_number.toString(),
//     ]);
//     const content = {
//       content: [
//         { text: 'Branch Data', style: 'header' },
//         {
//           table: {
//             headerRows: 1,
//             widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
//             body: [tableHeaders, ...tableRows],
//           },
//           style: 'font',
//         },
//       ],
//       styles: {
//         header: {
//           fontSize: 18,
//           bold: true,
//           alignment: 'center',
//           margin: [0, 0, 0, 10],
//         },
//         font: {
//           font: 'Roboto',
//         },
//       },
//     };
//     const printer = new pdfMake(fonts);
//     const pdfDoc = printer.createPdfKitDocument(content);
//     return pdfDoc;

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//     });
//   }
// };




// // //print PDF
// exports.printBranchDataPDF = async (req, res) => {
//   try {
//     const pdfDoc= await generateBranchPDF();
//     const fileName = `Branch-Data-${fileNameCounter}.pdf`;
//     fileNameCounter++;
//     const filePath = path.join(os.homedir(), 'Downloads', fileName);
//     // if (os.platform() === 'win32') {
//       //   filePath = path.join(os.homedir(), 'Downloads',fileName);
//       // } else {
//       //   filePath = '/root/Downloads';
//       // }
//     pdfDoc.pipe(fs.createWriteStream(filePath));
//     pdfDoc.end();

//     console.log('Successfully sent PDF.');
//     res.status(200).json({
//       success: true,
//       message: 'Successfully downloaded PDF.',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//     });
//   };
// }




//sharePDF with email
exports.shareEmailBranch = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Branch name is required in the request body' });
    }
  try {
    const pdfDoc= await generateBranchPDF();
    const fileName = `Branch-Data-${fileNameCounter}.pdf`;
    fileNameCounter++;

    shareWithEmail(email, pdfDoc, fileName)
    .then(() => {
      console.log('Shared Successfully.');
      res.status(200).json({
        success: true,
        message: 'Successfully Shared the PDF/file.',
      });
    })
    pdfDoc.end();
    }catch (error) {
        console.error(error);
        res.status(500).json({
        success: false,
        message: 'Server error',
        });
    }
    };






  

  //import data
exports.importBranchData = async (req, res) => {
  const { file } = req;
   
  if (!file) {
    return res.status(400).json({ success: false, message: 'file is required in the request body' });
  }
  let check;
  if(req.user.email !== undefined && !req.user.roles.includes('admin')){
    const role="branch";
    const rp = await RP.findOne({where: {role}});
    const hasReadPermission = rp.permissions.some(permission => permission.permission === "import" && permission.granted === true);
    // console.log(hasReadPermission);
    if(hasReadPermission !== true){
      return res.status(402).json({success: false,message:'Have no permission.' });
    }
    await userActivity("imported branch data", req.user.email );
  }
  try {
      if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/csv' ) {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {

        const workbook = xlsx.readFile(file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        // const importedData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const data = xlsx.utils.sheet_to_json(worksheet);
        check= processAndInsertData(data);
        fs.unlinkSync(file.path);
        if (check) {
          return res.status(200).json({ success: true, message: 'Valid data imported successfully', check });
        } else {
          return res.status(403).json({ success: false, message: 'No data imported.', check });
        }

      } else if (file.mimetype === 'text/csv') {
         // Import CSV file
         let data=[] ;
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
        });
      };
      // await userActivity("imported branch data", req.user.email );
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
  let check=false
  if (data.length === 0) {
    console.log('No data to process.');
    return; 
  }
  for (const row of data) {
    const {branch_name} = row;
    try {
      if(!branch_name){
        // console.log(`Skipping branch ${row.branch_name}!`);
        continue;
      }
      const existingBranch = await Branch.findOne({ where: { branch_name: row.branch_name } });

      if (existingBranch) {
        // console.log(`Branch ${branch_name} already exists in the database.`);
      } else {
        // console.log(`Branch ${branch_name} does not exist in the database. Proceed with storing it.`);
        await Branch.create(row);
        check=true;
      }
    } catch (error) {
      console.error(`Error processing and inserting data for branch ${branch_name}:`, error);
    }
  }console.log(check)
  return check
}

