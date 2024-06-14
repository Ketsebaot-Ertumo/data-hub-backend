const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const User = require('../models/userModel')(sequelize, DataTypes);
const { shareWithEmail} = require('../utilis/sendEmail');
const ErrorResponse = require('../utilis/errorResponse');
const  pdfMake = require('pdfmake');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const os = require('os');
const userActivity = require('../utilis/userActivity');
const RP = require('../models/rpModel')(sequelize, DataTypes);
const UR = require('../models/userRoleModel')(sequelize, DataTypes);


//show profile
exports.showProfile = async (req, res) => {
    const {email} = req.query;
    const user = await User.findOne({where: {email}, attributes: ['firstName','lastName','fullName', 'email', 'roles',], });
    await userActivity("viewed user profile ", req.user.email );
    res.status(200).json({success: true, user});
}



//show all users
exports.showUsers = async (req, res, next) => {
  try {
    if (req.user.email !== undefined && !req.user.roles.includes('admin')) {
      const role = 'user';
      const rp = await RP.findOne({ where: { role } });
      const hasReadPermission = rp.permissions.some(
        (permission) => permission.permission === 'read' && permission.granted === true
      );
      if (hasReadPermission !== true) {
        return res.status(402).json({ success: false, message: 'Have no permission.' });
      }
      await userActivity('viewed users', req.user.email);
    }

    // Pagination parameters
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const usersCount = await User.count();
    const totalPages = Math.ceil(usersCount / pageSize);

    const users = await User.findAll({
      attributes: ['firstName','lastName','fullName', 'email', 'roles'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total: usersCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    console.log('error occurred', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// //show all users
// exports.showUsers = async (req, res,next) => {
//   try{
//     if(req.user.email !== undefined && !req.user.roles.includes('admin')){
//       const role="user";
//       const rp = await RP.findOne({where: {role}});
//       const hasReadPermission = rp.permissions.some(permission => permission.permission === "read" && permission.granted === true);
//       // console.log(hasReadPermission);
//       if(hasReadPermission !== true){
//         return res.status(402).json({success: false,message:'Have no permission.' });
//       }
//       await userActivity("viewed users", req.user.email )
//     }
//      const users = await User.findAll({attributes: ['fullName', 'email', 'roles']});
//     // await userActivity("viewed users", req.user.email )
//     res.status(200).json({success: true,users });
//   }catch(err){
//     console.log('error occured', err);
//     res.status(500).json({success:false, error: err.message})
//   }
// };


exports.deleteUser = async (req, res, next) => {
    const { email } = req.query;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found or has been deleted before' });
      }
      if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        const role="user";
        const rp = await RP.findOne({where: {role}});
        const hasReadPermission = rp.permissions.some(permission => permission.permission === "delete" && permission.granted === true);
        // console.log(hasReadPermission);
        if(hasReadPermission !== true){
          return res.status(402).json({success: false,message:'Have no permission.' });
        }
        await userActivity(`deleted user ${email} `, req.user.email );
      }
      const ur = await UR.findOne({ where: { email } });
      await user.destroy();
      if(ur){await ur.destroy();}
      // await userActivity(`deleted user ${email} `, req.user.email );
      res.status(200).json({message: 'User deleted successfully',});
    } catch (err) {
      res.status(500).json({success: false,error: err.message,});
};
}



  //user profile update
  exports.updateUserProfile = async (req, res, next) => {
    const {email, newFirstName, newLastName,newType} = req.body;
    try {
      if(!email){
        return res.status(402).json({success:false, message: 'Please provide email.' });
        }else{
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        // if(req.user.email !== undefined && !req.user.roles.includes('admin')){
        //   const role="user";
        //   const rp = await RP.findOne({where: {role}});
        //   const hasReadPermission = rp.permissions.some(permission => permission.permission === "edit" && permission.granted === true);
        //   // console.log(hasReadPermission);
        //   if(hasReadPermission !== true){
        //     return res.status(402).json({success: false,message:'Have no permission.' });
        //   }
        //   await userActivity(`updated user ${email} `, req.user.email );
        // }
        if (newFirstName && newFirstName !== user.firstName) {
            user.firstName = newFirstName;
        }
        if (newLastName && newLastName !== user.lastName) {
          user.lastName = newLastName;
        }
        if (newType && newType !== user.compantType) {
            user.compantType = newType;
        }
      //   if (newEmail && newEmail !== user.email) {
      //     user.email = newEmail;
      // }
        // user.fullName = user.firstName + ' ' + user.lastName;
        await user.save();
        if(req.user.email !== undefined){
          await userActivity(`updated user ${email} `, req.user.email );
        }
        res.status(200).json({ message: 'User updated successfully',user});
      }} catch (err) {
        res.status(500).json({success: false,error: err.message,});
      }
    };


let fileNameCounter = 1;

// Export data with CSV
exports.exportDataCSV = async (req, res) => {
  try {
    const attributes = req.body.attributes;
    if (!Array.isArray(attributes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attributes provided, Please check attribute name.',
      });
    }
    const columnNames = Object.keys(User.rawAttributes);
    const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
    const attributeTitles = filteredColumnNames.map(column => User.rawAttributes[column].field || column);

    const fileName = `User-Title${fileNameCounter}.csv`;
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
    .then(() => {
      console.log('CSV file written successfully');
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

// Export data with Excel
exports.exportDataExcel = async (req, res) => {
  try {
    const attributes = req.body.attributes;
    if (!Array.isArray(attributes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attributes provided. Please check attribute names.',
      });
    }

    const columnNames = Object.keys(User.rawAttributes);
    const filteredColumnNames = columnNames.filter(column => attributes.includes(column));
    const attributeTitles = filteredColumnNames.map(column => User.rawAttributes[column].field || column);
    const fileName = `User-Title${fileNameCounter}.xlsx`;
    fileNameCounter++;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);
    await createExcel(attributeTitles, filePath);
    res.download(filePath, fileName);
    res.status(200).json({
      success: true,
      message: 'Successfully Downloaded a new CSV file.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false,message: error.message,});
  }
};

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

//generate PDF(common function)
const generatePDF = async (req, res) => {
  try {
    const userData = await User.findAll({ attributes: ['fullName', 'email', 'role', 'createdAt', 'updatedAt'] });
    const fonts = {
      Roboto: {
        // normal: vfsFonts.pdfMake.vfs['Roboto-Regular.ttf'],
        // bold: vfsFonts.pdfMake.vfs['Roboto-Bold.ttf'],
        bold: 'C:\\Users\\PC\\Desktop\\TE-DATA-API\\Bold.ttf',
        normal: 'C:\\Users\\PC\\Desktop\\TE-DATA-API\\Regular.ttf'
      },
    };
    const tableHeaders = ['Full Name', 'Email', 'Role', 'Created At', 'Updated At'];
    const tableRows = userData.map(user => [
      user.fullName,
      user.email,
      user.role,
      user.createdAt.toString(),
      user.updatedAt.toString(),
    ]);
    const content = {
      content: [
        { text: 'User Data', style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
            body: [tableHeaders, ...tableRows],
          },
          style: 'font',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        font: {
          font: 'Roboto',
        },
      },
    };
    const printer = new pdfMake(fonts);
    const pdfDoc = printer.createPdfKitDocument(content);
    return pdfDoc;

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// //print PDF
exports.printDataPDF = async (req, res) => {
  try {
  const pdfDoc= await generatePDF();
  const fileName = `User-Data-${fileNameCounter}.pdf`;
  fileNameCounter++;
  // const filePath = path.join(os.homedir(), 'Downloads', fileName);
  if (os.platform() === 'win32') {
    filePath = path.join(os.homedir(), 'Downloads');
  } else {
    filePath = '/root/Downloads';
  }
    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.end();

    console.log('Successfully sent PDF.');
    res.status(200).json({
      success: true,
      message: 'Successfully downloaded PDF.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  };
}


//sharePDF with email
exports.shareEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const pdfDoc = await generatePDF();
    const fileName = `User-Data-${fileNameCounter}.pdf`;
    fileNameCounter++;

    shareWithEmail(email, pdfDoc, fileName)
      .then(() => {
        console.log('Shared Successfully.');
        res.status(200).json({
          success: true,
          message: 'Successfully Shared the PDF/file.',
        });
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({
          success: false,
          message: error.message,
        });
      });
    // });
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

