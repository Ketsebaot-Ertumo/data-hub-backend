const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const Company = require('../models/companyModel')(sequelize, DataTypes);
const userActivity = require('../utilis/userActivity');
const RP = require('../models/rpModel');
const ExcelJS = require('exceljs');
const fs = require('fs');
const xlsx = require('xlsx');
const path =require('path');
const os = require('os');
const csv = require('csv-parser');
const { convertAmharicToEnglish } = require('./test');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { Op } = require('sequelize');



exports.createCompany = async (req, res) => {
    const { business_name, code, address, email } = req.body;
    try {
      if(!business_name ){
        res.status(402).json({success:false, message: 'Please provide name.'});
      }else{
      const companyExist = await Company.findOne({ where: { business_name} });
      if (companyExist){
        return res.status(406).json({success: false,message: "This company name already registered/exist." });
       }else{
      // const company = await Company.create({name,code,address,email});
      const company = await Company.create(req.body);
      if(req.user.email !== undefined){
         await userActivity('created company.', req.user.email );
       }
      res.status(201).json({success:true,company});
       }
    }} catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({success:false, message: 'Failed to create Company',error:error.message });
    }
  };



exports.allCompany = async (req, res) => {
    try {
      const company = await Company.findAll({attributes: ['id','legal_name','business_name','code','address','email','phone_number','FAX','POB','country']});
      // if(req.user.email !== undefined){
      //    await userActivity('viewed all companies list.', req.user.email );
      //  }
      res.status(201).json({success:true,company});
    } catch (error) {
      console.error('Error showing all companies.:', error);
      res.status(500).json({success:false, message: 'Failed to show all Companies list.',error:error.message});
    }
  };




exports.company = async (req, res) => {
    const { business_name,code } = req.query;
    try {
      if(!business_name
        && !code){
        return res.status(402).json({success:false, message: 'Please provide name or code'});
      }
      const whereClause = {};
      if (business_name) {
          whereClause.business_name = business_name;
      }
      if (code) {
          whereClause.code = code;
      }
      const company = await Company.findOne({where:whereClause,attributes: ['id','name','code','address','email','phone_number','FAX','POB','country']});
      if(req.user.email !== undefined){
         await userActivity('viewed about a company .', req.user.email );
       }
      res.status(201).json({success:true,company});
    } catch (error) {
      console.error('Error showing a company.:', error);
      res.status(500).json({success:false, message: 'Failed to show a Company.',error:error.message});
    }
  };



exports.editCompany = async (req, res) => {
    const { business_name,code, newName, newAddress, newCode ,newEmail,newPOB,newFAX,newCountry,newPhone} = req.body;
    try {
      if(!business_name && !code){
        return res.status(402).json({success:false, message: 'Please provide name or code of a company'});
      }
       const whereClause = {};
        if (business_name) {
            whereClause.business_name = business_name;
        }
        if (code) {
            whereClause.code = code;
        }
      const company = await Company.findOne({where:whereClause});
      if(!company){
        return res.status(404).json({success:false, message: 'Company not found.'});
      }
      if (newEmail && newEmail !== company.email) {
        company.email = newEmail;
       }
      if (newAddress && newAddress !== company.address) {
        company.title = newAddress;
       }
      if (newName && newName !== company.business_name) {
        company.business_name = newName;
       }
       if (newName && newName !== company.legal_name) {
        company.legal_name = newName;
       }
       if (newCode && newCode !== company.code) {
        company.code = newCode;
       }
       if (newPOB && newPOB !== company.POB) {
        company.POB = newPOB;
       }
       if (newFAX && newFAX !== company.FAX) {
        company.FAX = newFAX;
       }
       if (newPhone && newPhone !== company.phone_number) {
        company.phone_number = newPhone;
       }
       if (newCountry && newCountry !== company.country) {
        company.country = newCountry;
       }
      await company.save();
      if(req.user.email !== undefined){
         await userActivity('edited about a company', req.user.email );
       }
      res.status(201).json({success:true,company});
    } catch (error) {
      console.error('Error editing a company:', error);
      res.status(500).json({success:false, message: 'Failed to edit a company.',error:error.message });
    }
  };



  exports.deleteCompany = async (req, res) => {
    const { business_name,code } = req.query;
    try {
      if(!business_name && !code){
        return res.status(402).json({success:false, message: 'Please provide name or code of a company'});
      }
        const whereClause = {};
        if (business_name) {
            whereClause.business_name = business_name;
        }
        if (code) {
            whereClause.code = code;
        }
      const company = await Company.findOne({where:whereClause});
      if(!company){
        return res.status(404).json({success:false, message: 'Company not found.'});
      }
      await company.destroy();
      if (req.user.email !== undefined) {
        await userActivity(`deleted the detail of the ${company.name} company`, req.user.email);
      }
      res.status(200).json({ success: true, message: 'Successfully deleted.' });
    } catch (error) {
      console.error('Error deleting company detail:', error);
      res.status(500).json({ success: false, message: 'Failed to delete a company detail.', error: error.message });
    }
  };



let fileNameCounter = 1;  


// Export data with CSV
exports.exportCSV = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Company.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Company.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
  
    const fileName = `Company-Title${fileNameCounter}.csv`;
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);   

    await createCSV(attributeTitles, filePath);
    // if(req.user.email !== undefined){
    //   await userActivity("exported company title", req.user.email );
    // }
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
exports.exportExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;

    let attributeTitles;
    const columnNames = Object.keys(Company.rawAttributes);
    if(attributes){
      const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
      attributeTitles = filteredColumnNames.map(column => Company.rawAttributes[column].field || column);
    }
    attributeTitles=columnNames
    const fileName = `Company-Title${fileNameCounter}.xlsx`; //generated excel file
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);

    await createExcel(attributeTitles, filePath);  //you need to uncomment if you want to download file to local 'downloads'.
    // if(req.user.email !== undefined){
    //   await userActivity("exported company title", req.user.email );
    // }
    res.download(filePath, fileName);  //you need to uncomment if you want to download file to local 'downloads'.
    res.status(200).json({ success: true, message: 'Successfully Show/Downloaded a new Excel file.',attributeTitles });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false,message: 'Server error',error:error.message});
  }
};

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




  //import data
  exports.importData = async (req, res) => {
    const { file } = req;
     
    if (!file) {
      return res.status(400).json({ success: false, message: 'file is required in the request body' });
    }let check;
    try {
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/csv' ) {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
  
          const workbook = xlsx.readFile(file.path);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          // const importedData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
          const data = xlsx.utils.sheet_to_json(worksheet);
          check=await processAndInsertData(data);
          fs.unlinkSync(file.path);
          if(check){
            return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
          }else{
            return res.status(403).json({ success: false, message: 'No data imported.' ,check});
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
            check=await processAndInsertData(data);
            console.log('new',file.path)
            fs.unlinkSync(file.path); 
            if(check){
              return res.status(200).json({ success: true, message: 'Valid data imported successfully',check });
            }else{
              return res.status(403).json({ success: false, message: 'No data imported.' ,check});
            }
          });
        }
        if(req.user.email !== undefined){
          await userActivity("imported company data", req.user.email );
        }
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
      const {code,business_name,Licence_number} = row;
      try {
        const codeString = `'${code}'`;
        row.business_name = convertAmharicToEnglish(business_name);
        // const existingData = await Company.findOne({ where: { business_name,Licence_number } });
        const existingData = await Company.findOne({ where: { 
          business_name: { 
            [Op.iLike]: `%${business_name}%` 
          },
          Licence_number: { 
            [Op.iLike]: `%${Licence_number}%` 
          }
        }  });
  
        if (existingData) {
          console.log(`Company ${business_name} already exists in the database.`);
        } else {
          console.log(`Company ${business_name} does not exist in the database. Proceed with storing it.`);
          row.legal_name = convertAmharicToEnglish(row.legal_name);
          row.woreda = convertAmharicToEnglish(row.woreda);
          row.house_number = convertAmharicToEnglish(row.house_number);
          row.description = convertAmharicToEnglish(row.description);
          row.businessIn = convertAmharicToEnglish(row.businessIn);
          await Company.create(row);
          check=true
        }
      } catch (error) {
        console.error(`Error processing and inserting data for company '${business_name}':`, error);
      }
    }
  }
  
  