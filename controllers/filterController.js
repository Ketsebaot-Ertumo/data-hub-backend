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


exports.filterUser = async (req, res, next) => {
  console.log(req.query);
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
  }
  try {
    const { page, limit, ...filters } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const [columnName, columnValue] of Object.entries(filters)) {
      if (columnName === 'roles') {
        whereConditions.push({
          [columnName]: { [Op.contains]: [columnValue] }
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
          ],
        });
      }
    }

    const usersCount = await User.count({
      where: {
        [Op.and]: whereConditions
      },
    });

    const totalPages = Math.ceil(usersCount / pageSize);

    const searchResults = await User.findAll({
      where: {
        [Op.and]: whereConditions
      },
      attributes: ['firstName','lastName','fullName', 'email', 'roles'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user.email !== undefined) {
      await userActivity("filtered to view User data", req.user.email);
    }

    res.status(200).json({
      success: true,
      users: searchResults,
      pagination: {
        total: usersCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// exports.filterUser = async (req, res, next) => {
//   // const { searchValues } = req.query;
//   console.log(req.query)
//   if (!req.query || Object.keys(req.query).length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//   }
//   try {
//     const whereConditions = [];
//     for (const [columnName, columnValue] of Object.entries(req.query)) {
//       // const lowercasedSearchValue = columnValue.toLowerCase();
//       if(columnName === 'roles'){
//         whereConditions.push({
//           [columnName]: {[Op.contains]: [columnValue]}
//         });
//       }
//       else{
//       whereConditions.push({
//         [Op.or]: [
//           { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//         ],
//       });
//     }}
//     const searchResults = await User.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },attributes: ['fullName', 'email', 'roles'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'User not found.' });
//     }
//     if (req.user.email !== undefined) {
//       await userActivity("filtered to view User data", req.user.email);
//     }

//     res.status(200).json({ success: true, user: searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


exports.filterCustomer = async (req, res, next) => {
  console.log(req.query);
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
  }
  try {
    const { page, limit, ...filters } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    let frombirthdate = filters.frombirthdate;
    let tobirthdate = filters.tobirthdate;
    let fromAge = filters.fromAge;
    let toAge = filters.toAge;
    if (frombirthdate) {
      whereConditions.push({
        birth_date: { [Op.gte]: frombirthdate }
      });
    }
    if (tobirthdate) {
      whereConditions.push({
        birth_date: { [Op.lte]: tobirthdate }
      });
    }
    if (frombirthdate && tobirthdate) {
      whereConditions.push({
        birth_date: { [Op.between]: [frombirthdate, tobirthdate] }
      });
    }
    for (const [columnName, columnValue] of Object.entries(filters)) {
      if (
        columnName !== 'frombirthdate' &&
        columnName !== 'tobirthdate' &&
        columnName !== 'fromAge' &&
        columnName !== 'toAge' &&
        columnName !== 'age'
      ) {
        whereConditions.push({
          [Op.or]: [
            { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
          ],
        });
      }
    }

    const customersCount = await Customer.count({
      where: {
        [Op.and]: whereConditions
      },
    });

    const totalPages = Math.ceil(customersCount / pageSize);

    let searchResults = await Customer.findAll({
      where: {
        [Op.and]: whereConditions
      },
      attributes: ['full_name','customer_type', 'code', 'birth_date', 'gender', 'regionstate', 'subcity', 'woreda', 'ketena', 'house_number', 'age'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    const filteredResults = searchResults.filter(result => result.full_name !== '' || result.code !== '');
    if (fromAge && toAge) {
      searchResults = filteredResults.filter(result => result.age >= Number(fromAge) && result.age <= Number(toAge) && result.age !== null);
    }
    if (fromAge && !isNaN(fromAge)) {
      searchResults = filteredResults.filter(result => result.age >= Number(fromAge) && result.age !== null);
    }
    if (toAge && !isNaN(toAge)) {
      searchResults = filteredResults.filter(result => result.age <= Number(toAge) && result.age !== null);
    }
    if (filters.age && !isNaN(filters.age)) {
      searchResults = filteredResults.filter(result => result.age === Number(filters.age));
    }
    if (filteredResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    if (req.user.email !== undefined) {
      await userActivity('filtered to view Customer data', req.user.email);
    }
    res.status(200).json({
      success: true,
      customers: searchResults,
      pagination: {
        total: customersCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// exports.filterCustomer = async (req, res, next) => {
//   console.log(req.query);
//   if (!req.query || Object.keys(req.query).length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//   }

//   try {
//     const whereConditions = [];
//     let frombirthdate = req.query.frombirthdate;
//     let tobirthdate = req.query.tobirthdate;
//     let fromAge = req.query.fromAge;
//     let toAge = req.query.toAge;
//     if (frombirthdate ) {
//       whereConditions.push({
//         birth_date: { [Op.gte]: frombirthdate }
//       });
//     }
//     if (tobirthdate ) {
//       whereConditions.push({
//         birth_date: { [Op.lte]: tobirthdate }
//       });
//     }
//     if (frombirthdate && tobirthdate) {
//       whereConditions.push({
//         birth_date: { [Op.between]: [frombirthdate, tobirthdate] }
//       });
//     }
//     for (const [columnName, columnValue] of Object.entries(req.query)) {
//       if (columnName !== 'frombirthdate' && columnName !== 'tobirthdate' && columnName !== 'fromAge' &&  columnName !== 'toAge' && columnName !== 'age') {
//         whereConditions.push({
//           [Op.or]: [
//             { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//           ],
//         });
//       }
//     }
//     let searchResults = await Customer.findAll({
//       where: {
//         [Op.and]: whereConditions
//       },
//       attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate', 'subcity', 'woreda', 'ketena', 'house_number','age'],
//     });
//     const filteredResults = searchResults.filter(result => result.full_name !== '' || result.code !== '');
//     if (fromAge && toAge) {
//       searchResults = filteredResults.filter(result => result.age >= Number(fromAge) && result.age <= Number(toAge) && result.age !== null);
//     }
//     if (fromAge && !isNaN(fromAge)) {
//       searchResults = filteredResults.filter(result => result.age >= Number(fromAge) && result.age !== null);
//     }
//     if (toAge && !isNaN(toAge)) {
//       searchResults = filteredResults.filter(result => result.age <= Number(toAge) && result.age !== null);
//     }
//     if (req.query.age && !isNaN(req.query.age)) {
//       searchResults = filteredResults.filter(result => result.age === Number(req.query.age));
//     }
//     if (filteredResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Customer not found.' });
//     }
//     if (req.user.email !== undefined) {
//       await userActivity('filtered to view Customer data', req.user.email);
//     }
//     res.status(200).json({ success: true, customer: searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

exports.filterSales = async (req, res, next) => {
  console.log(req.query);
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
  }

  try {
    const { page, limit, ...filters } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const [columnName, columnValue] of Object.entries(filters)) {
      if ((columnName === 'quantity' || columnName === 'total_inc_vat' || columnName === 'vat' || columnName === 'total_for_vat_items' || columnName === 'total' || columnName === 'total_price' || columnName === 'unit_price') && !isNaN(columnValue)) {
        // Handle id column as integer or decimal
        whereConditions.push({
          [columnName]: Number(columnValue)
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
          ],
        });
      }
    }

    const salesCount = await Sales.count({
      where: {
        [Op.and]: whereConditions
      },
    });

    const totalPages = Math.ceil(salesCount / pageSize);

    const searchResults = await Sales.findAll({
      where: {
        [Op.and]: whereConditions
      },
      attributes: ['name', 'full_name', 'id_number', 'customer_subcity', 'customer_woreda', 'item_code', 'description', 'uom', 'quantity', 'unit_price', 'total', 'total_for_vat_items',
        'vat', 'total_inc_vat', 'prepared', 'cashier_full_name', 'creation'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales not found.' });
    }

    if (req.user.email !== undefined) {
      await userActivity("filtered to view Sales data", req.user.email);
    }

    res.status(200).json({
      success: true,
      sales: searchResults,
      pagination: {
        total: salesCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// exports.filterSales = async (req, res, next) => {
//   // const { searchValues } = req.query;
//   console.log(req.query)
//   if (!req.query || Object.keys(req.query).length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//   }

//   try {
//     const whereConditions = [];
//     for (const [columnName, columnValue] of Object.entries(req.query)) {
//       if ((columnName === 'quantity' || columnName === 'total_inc_vat' || columnName === 'vat' || columnName === 'total_for_vat_items' || columnName === 'total' || columnName === 'total_price' || columnName === 'unit_price') && !isNaN(columnValue)) {
//         // Handle id column as integer or decimal
//         whereConditions.push({
//           [columnName]: Number(columnValue)
//         });
//       }
//       // const lowercasedSearchValue = columnValue.toLowerCase();
//       else{
//       whereConditions.push({
//         [Op.or]: [
//           { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//         ],
//       });}
//     }
//     const searchResults = await Sales.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['name' ,'full_name' ,'id_number','customer_subcity','customer_woreda' ,'item_code','description','uom','quantity','unit_price','total','total_for_vat_items',
//       'vat','total_inc_vat','prepared','cashier_full_name', 'creation',],
//     });

//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Sales not found.' });
//     }

//     if (req.user.email !== undefined) {
//       await userActivity("filtered to view Sales data", req.user.email);
//     }

//     res.status(200).json({ success: true, sales: searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


exports.filterBranch = async (req, res, next) => {
  console.log(req.query);
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
  }

  try {
    const { page, limit, ...filters } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const [columnName, columnValue] of Object.entries(filters)) {
      if ((columnName === 'branch_number' || columnName === 'woreda') && !isNaN(columnValue)) {
        whereConditions.push({
          [columnName]: Number(columnValue)
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
          ],
        });
      }
    }

    const branchesCount = await Branch.count({
      where: {
        [Op.and]: whereConditions
      },
    });

    const totalPages = Math.ceil(branchesCount / pageSize);

    const searchResults = await Branch.findAll({
      where: {
        [Op.and]: whereConditions
      },
      attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Branch not found!' });
    }

    if (req.user.email !== undefined) {
      await userActivity("filtered to view Branch data.", req.user.email);
    }

    res.status(200).json({
      success: true,
      branches: searchResults,
      pagination: {
        total: branchesCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// exports.filterBranch = async (req, res, next) => {
//   // const { searchValues } = req.query;
//   console.log(req.query)
//   if (!req.query || Object.keys(req.query).length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//   }

//   try {
//     const whereConditions = [];
//     for (const [columnName, columnValue] of Object.entries(req.query)) {
//       if((columnName === 'branch_number' || columnName === 'woreda') && !isNaN(columnValue)){
//         whereConditions.push({
//           [columnName]: Number(columnValue)
//         });
//       }
//       else{
//       whereConditions.push({
//         [Op.or]: [
//           { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//         ],
//       });}
//     }
//     const searchResults = await Branch.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number'],
//     });

//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Branch not found!' });
//     }

//     if (req.user.email !== undefined) {
//       await userActivity("filtered to view Branch data.", req.user.email);
//     }

//     res.status(200).json({ success: true, branch: searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


exports.filterOrganization = async (req, res, next) => {
  console.log(req.query);
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
  }

  try {
    const { page, limit, ...filters } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const [columnName, columnValue] of Object.entries(filters)) {
      whereConditions.push({
        [Op.or]: [
          { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
        ],
      });
    }

    const organizationsCount = await Organization.count({
      where: {
        [Op.and]: whereConditions
      },
    });

    const totalPages = Math.ceil(organizationsCount / pageSize);

    const searchResults = await Organization.findAll({
      where: {
        [Op.and]: whereConditions
      },
      attributes: ['organization_type', 'name1', 'phone', 'email', 'address', 'subcity', 'woreda', 'house_number'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization not found!' });
    }

    if (req.user.email !== undefined) {
      await userActivity("filtered to view Organization data.", req.user.email);
    }

    res.status(200).json({
      success: true,
      organizations: searchResults,
      pagination: {
        total: organizationsCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// exports.filterOrganization = async (req, res, next) => {
//   // const { searchValues } = req.query;
//   console.log(req.query)
//   if (!req.query || Object.keys(req.query).length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//   }

//   try {
//     const whereConditions = [];
//     for (const [columnName, columnValue] of Object.entries(req.query)) {
//       // const lowercasedSearchValue = columnValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//         ],
//       });
//     }
//     const searchResults = await Organization.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['organization_type','name1','phone','email','address','subcity','woreda','house_number'],
//     });

//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Organization not found!' });
//     }

//     if (req.user.email !== undefined) {
//       await userActivity("filtered to view Organization data.", req.user.email);
//     }

//     res.status(200).json({ success: true, organization: searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


exports.filterProduct = async (req, res, next) => {
  console.log(req.query);
  if (!req.query || Object.keys(req.query).length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
  }

  try {
    const { page, limit, ...filters } = req.query;

    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const [columnName, columnValue] of Object.entries(filters)) {
      if ((columnName === 'vat' || columnName === 'unit_selling_price' || columnName === 'total_selling_price' || columnName === 'quantity') && !isNaN(columnValue)) {
        whereConditions.push({
          [columnName]: Number(columnValue)
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
          ],
        });
      }
    }

    const productsCount = await Product.count({
      where: {
        [Op.and]: whereConditions
      },
    });

    const totalPages = Math.ceil(productsCount / pageSize);

    const searchResults = await Product.findAll({
      where: {
        [Op.and]: whereConditions
      },
      attributes: ['kenema_pharmacy_drug_shop_number', 'description', 'item_code', 'unit', 'brand', 'pharmacological_category', 'manufacturer', 'batch_number', 'exp_date', 'vat', 'quantity', 'unit_selling_price', 'total_selling_price'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Product/s not found!' });
    }

    if (req.user.email !== undefined) {
      await userActivity("filtered to view Products data.", req.user.email);
    }

    res.status(200).json({
      success: true,
      products: searchResults,
      pagination: {
        total: productsCount,
        page: pageNumber,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};





// exports.filter = async (req, res, next) => {
//     if (!req.query || Object.keys(req.query).length === 0) {
//       return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//     }
  
//     try {
//       const whereConditions = []; let region,subcity,woreda,ketena,house_number;
//       // const attributes = [];
  
//       for (const [columnName, columnValue] of Object.entries(req.query)) {
//         if (columnName === 'regionstate' || columnName === 'subcity' || columnName === 'woreda' && columnName === 'ketena' && columnName === 'house_number') {
//           whereConditions.push({
//             [Op.or]: [
//               { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//             ],
//           });
//         }
//         }

//         region = await Customer.findAll({
//           attributes: [[sequelize.literal('DISTINCT "regionstate"'), 'regionstate']],
//           where: whereConditions,
//           // where: { [Op.and]: { ...whereConditions, subcity: { [Op.ne]: null, [Op.ne]: '' } } },
//           raw: true,
//         });

//         subcity = await Customer.findAll({
//         attributes: [[sequelize.literal('DISTINCT "subcity"'), 'subcity']],
//         where: whereConditions,
//         raw: true,
//       });
//       // subcity = subcity.map(entry => entry.subcity);
//         woreda = await Customer.findAll({
//         distinct: true,
//         attributes: [[sequelize.literal('DISTINCT "woreda"'), 'woreda']],
//         where: { [Op.and]: whereConditions },
//       });
//         ketena = await Customer.findAll({
//         distinct: true,
//         attributes: [[sequelize.literal('DISTINCT "ketena"'), 'ketena']],
//         where: { [Op.and]: whereConditions },
//       });
  
//       res.status(200).json({ success: true, region,subcity,woreda,ketena,house_number });
//     } catch (error) {
//       console.error('Error executing search:', error);
//       res.status(500).json({ success: false, error: error.message });
//     }
//   };



// exports.filterProduct = async (req, res, next) => {
//   // const { searchValues } = req.query;
//   console.log(req.query)
//   if (!req.query || Object.keys(req.query).length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide filtered value/s.' });
//   }

//   try {
//     const whereConditions = [];
//     // if(!isNaN(columnValue)){
//     for (const [columnName, columnValue] of Object.entries(req.query)) {
//       if ((columnName === 'vat' || columnName === 'unit_selling_price' || columnName === 'total_selling_price' || columnName === 'quantity') && !isNaN(columnValue) ) {
//         whereConditions.push({
//           [columnName]: Number(columnValue)
//         });
//       }
//       else{ 
//         // if(!isNaN(columnValue)){
//       whereConditions.push({
//         [Op.or]: [
//           { [columnName]: { [Op.iLike]: `%${columnValue}%` } }
//         ],
//       });}
//     // }
//     }
//     const searchResults = await Product.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['kenema_pharmacy_drug_shop_number','description','item_code','unit','brand','pharmacological_category','manufacturer','batch_number', 'exp_date','vat','quantity','unit_selling_price','total_selling_price'],
//     });

//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Product/s not found!' });
//     }

//     if (req.user.email !== undefined) {
//       await userActivity("filtered to view Products data.", req.user.email);
//     }

//     res.status(200).json({ success: true, product: searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



// //filter user data
// exports.filterUser = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {fullName: {[Op.iLike]: `%${lowercasedSearchValue}%`, },},
//           {email: {[Op.iLike]: `%${lowercasedSearchValue}%`, },},
//           {roles: {[Op.contains]: [lowercasedSearchValue],},},
//         ],
//       });
//     }
//     const searchResults = await User.findAll({
//       where: {[Op.and]: whereConditions,},attributes: ['fullName', 'email', 'roles'],});
//     if (searchResults.length === 0 || !searchResults || searchResults==='') {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("filtered to view user data", req.user.email );
//     }
//     res.status(200).json({ success: true, users:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



// //filter sales
// exports.filterSales = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {name: {[Op.iLike]: `%${lowercasedSearchValue}%`,},},
//           {full_name: {[Op.iLike]: `%${searchValue}%`,},},
//           {id_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {customer_subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {customer_woreda: {[Op.iLike]: `%${searchValue}%`,},},
//           {item_code: {[Op.iLike]: `%${searchValue}%`,},},
//           {uom: {[Op.iLike]: `%${searchValue}%`,},},
//           {quantity: parseInt(searchValue)},
//           {unit_price: parseFloat(searchValue),},
//           {total: parseFloat(searchValue),},
//           {total_for_vat_items: parseFloat(searchValue),},
//           {vat: parseFloat(searchValue),},
//           {total_inc_vat: parseFloat(searchValue),},
//           {cashier_full_name: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//     const searchResults = await Sales.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
      // attributes: ['name' ,'full_name' ,'id_number','customer_subcity','customer_woreda' ,'item_code','description','uom','quantity','unit_price','total','total_for_vat_items',
      // 'vat','total_inc_vat','prepared','cashier_full_name', 'creation',],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Sales not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("filtered to view sales data", req.user.email );
//     }
//     res.status(200).json({ success: true, users:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };





// //filter customer
// exports.filterCustomer = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(403).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {full_name: {[Op.iLike]: `%${searchValue}%`,},},
//           {customer_type: {[Op.iLike]: `%${searchValue}%`,},},
//           {code: {[Op.iLike]: `%${searchValue}%`,},},
//           // { birth_date: { [Op.gte]: new Date(searchValue) } }, 
//           // {birth_date: {[Op.iLike]: `%${searchValue}%`,},},
//           {gender: {[Op.iLike]: `%${searchValue}%`,},},
//           {regionstate: {[Op.iLike]: `%${searchValue}%`,},},
//           {subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {woreda: {[Op.iLike]: `%${searchValue}%`,},},
//           {ketena: {[Op.iLike]: `%${searchValue}%`,},},
//           {house_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {age: parseInt(searchValue),},
//         ],
//       });
//     }
//     const searchResults = await Customer.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['full_name', 'code', 'birth_date', 'gender', 'regionstate','subcity', 'woreda', 'ketena', 'house_number'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("filtered to view customer data", req.user.email );
//     }
//     res.status(200).json({ success: true, customers:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



// //filter branch
// exports.filterBranch = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(403).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {branch_name: {[Op.iLike]: `%${searchValue}%`,},},
//           {branch_number: parseInt(searchValue),},
//           {subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {woreda: parseInt(searchValue),},
//           {house_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {email: {[Op.iLike]: `%${searchValue}%`,},},
//           {phone_number: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//     const searchResults = await Branch.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("filtered to view branch data", req.user.email );
//     }
//     res.status(200).json({ success: true, branchs:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



// //filter organization
// exports.filterOrganization = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(403).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {organization_type: {[Op.iLike]: `%${searchValue}%`,},},
//           {name1: {[Op.iLike]:`%${searchValue}%`,}},
//           {phone: {[Op.iLike]: `%${searchValue}%`,},},
//           {email: {[Op.iLike]: `%${searchValue}%`,},},
//           {address: {[Op.iLike]: `%${searchValue}%`,},},
//           {subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {woreda: {[Op.iLike]: `%${searchValue}%`,},},
//           {worehouse_numberda: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//     const searchResults = await Organization.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['organization_type','name1','phone','email','address','subcity','woreda','house_number'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("filtered to view organization data", req.user.email );
//     }
//     res.status(200).json({ success: true, branchs:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



// //filter product
// exports.filterProduct = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(403).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {organizakenema_pharmacy_drug_shop_numbertion_type: {[Op.iLike]: `%${searchValue}%`,},},
//           {nadescriptionme1: {[Op.iLike]:`%${searchValue}%`,}},
//           {phoitem_codene: {[Op.iLike]: `%${searchValue}%`,},},
//           {unit: {[Op.iLike]: `%${searchValue}%`,},},
//           {address: {[Op.iLike]: `%${searchValue}%`,},},
//           {brand: {[Op.iLike]: `%${searchValue}%`,},},
//           {pharmacological_category: {[Op.iLike]: `%${searchValue}%`,},},
//           {manufacturer: {[Op.iLike]: `%${searchValue}%`,},},
//           {batch_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {exp_date: {[Op.iLike]: `%${searchValue}%`,},},
//           {vat: parseFloat(searchValue),},
//           {quantity: parseInt(searchValue),},
//           {unit_selling_price: parseFloat(searchValue),},
//           {total_selling_price: parseFloat(searchValue),},
//         ],
//       });
//     }
//     const searchResults = await Product.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['kenema_pharmacy_drug_shop_number','description','item_code','unit','address','brand','pharmacological_category','manufacturer','batch_number', 'exp_date','vat','quantity','unit_selling_price','total_selling_price'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("filtered to view product data", req.user.email );
//     }
//     res.status(200).json({ success: true, branchs:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



