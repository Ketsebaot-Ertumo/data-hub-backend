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
const models = {
    User: require('../models/userModel')(sequelize, DataTypes),
    Customer: require('../models/customerModel')(sequelize, DataTypes),
    Branch: require('../models/branchModel')(sequelize, DataTypes),
    Product: require('../models/productModel')(sequelize, DataTypes),
    Sales: require('../models/salesModel')(sequelize, DataTypes),
    Organization: require('../models/organizationModel')(sequelize, DataTypes),
  };
  
  exports.search = async (req, res) => {
    // const {searchValue} = req.body;
    const {searchValue} = req.query;
    
    try {
      const searchResults = {};
      const searchPromises = [];
  
      for (const modelName in models) {
        const model = models[modelName];
        const searchColumns = Object.keys(model.rawAttributes);
        const searchConditions = searchColumns.map(column => {
          const columnType = model.rawAttributes[column].type.constructor.key;
  
          if (columnType !== 'STRING') {
            if (!isNaN(searchValue)) {
            if(columnType === 'INTEGER'){
                return {
                  [column]: parseInt(searchValue),  
                };
              }
            if(columnType === 'DECIMAL'){
              return {
                [column]: parseFloat(searchValue),  
              };
            }
            if(columnType === 'DATEONLY'){
              return {
                [column]: { [Op.gte]: new Date(searchValue) } , 
              };
            }
            if(columnType === 'DATE'){
              return {
                [column]:  new Date(searchValue) , 
              };}
            }if(columnType === 'ARRAY'){
              return {
                [column]:  {[Op.contains]: [searchValue],},
              };
            }
          } else if (columnType === 'STRING') {
            return {
              [column]: { [Op.iLike]: `%${searchValue}%` },
            };
          } else {
            return null;
          }
        }).filter(condition => condition !== null); 
  
        if (searchConditions.length > 0) {
            let attributes = searchColumns;

            if (modelName === 'User') {
                attributes = ['firstName','lastName', 'email', 'roles',];
            } else if (modelName === 'Customer') {
                attributes = ['full_name', 'code', 'birth_date', 'gender', 'phone_number', 'regionstate', 'woreda', 'ketena', 'house_number'];
            } else if (modelName === 'Branch'){
                attributes= ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number',]
            } else if (modelName === 'Organization'){
                attributes= ['organization_type','name1','phone','email','address','subcity','woreda','house_number']
            }else if (modelName === 'Sales'){
                attributes= ['name' ,'full_name' ,'id_number','customer_subcity','customer_woreda' ,'item_code','description','uom','quantity','unit_price','total','total_for_vat_items',
                'vat','total_inc_vat','prepared','cashier_full_name']
            }else if (modelName === 'Product'){
                attributes= ['kenema_pharmacy_drug_shop_number','description','item_code','unit','brand','manufacturer','batch_number', 'exp_date','vat','quantity','unit_selling_price','total_selling_price']
            }
          const searchPromise = model.findAll({
            where: {
              [Op.or]: searchConditions,
            },attributes,
          }).then(data => {
            if (data.length > 0) {
              searchResults[modelName.toLowerCase()] = data;
            }
          });
          searchPromises.push(searchPromise);
        }
      }
      await Promise.all(searchPromises);
      if(req.user.email !== undefined){
        await userActivity("use global search.", req.user.email );
      }
      res.status(200).json({ searchResults });
    } catch (error) {
      console.error('Error executing search:', error);
      res.status(500).json({ error: error.message });
    }
  };


  //search users
  exports.searchUser = async (req, res, next) => {
    const { searchValues, page, limit } = req.query;
    if (!searchValues || searchValues.length === 0) {
      return res.status(401).json({ success: false, message: 'Please provide search value.' });
    }
    const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
  
    try {
      // Convert page and limit values to numbers
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 20;
  
      const whereConditions = [];
      for (const searchValue of searchValueArray) {
        whereConditions.push({
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${searchValue}%` } },
            { lastName: { [Op.iLike]: `%${searchValue}%` } },
            { email: { [Op.iLike]: `%${searchValue}%` } },
            { roles: { [Op.contains]: [searchValue] } },
          ],
        });
      }
  
      const usersCount = await User.count({
        where: {
          [Op.and]: whereConditions,
        },
      });
  
      const totalPages = Math.ceil(usersCount / pageSize);
  
      const searchResults = await User.findAll({
        where: {
          [Op.and]: whereConditions,
        },
        attributes: ['firstName','lastName','fullName', 'email', 'roles'],
        offset: (pageNumber - 1) * pageSize,
        limit: pageSize,
      });
  
      if (searchResults.length === 0 || !searchResults || searchResults === '') {
        return res.status(404).json({ success: false, message: 'Not found.' });
      }
  
      if (req.user.email !== undefined) {
        await userActivity("searched to view user data", req.user.email);
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

  
// //search user data
// exports.searchUser = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide search value.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   // console.log(searchValue)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {fullName: {[Op.iLike]: `%${searchValue}%`, },},
//           {email: {[Op.iLike]: `%${searchValue}%`, },},
//           {roles: {[Op.contains]: [searchValue],},},
//         ],
//       });
//     }
//     const searchResults = await User.findAll({
//       where: {[Op.and]: whereConditions,},attributes: ['fullName', 'email', 'roles'],});
//     if (searchResults.length === 0 || !searchResults || searchResults==='') {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("searched to view user data", req.user.email );
//     }
//     res.status(200).json({ success: true, users:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


//search sales attachement data
exports.searchSales = async (req, res, next) => {
  const { searchValues, page, limit } = req.query;
  if (!searchValues || searchValues.length === 0) {
    return res.status(401).json({ success: false, message: 'Please provide search values.' });
  }
  const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];

  try {
    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const searchValue of searchValueArray) {
      if (!isNaN(searchValue)) {
        whereConditions.push({
          [Op.or]: [
            { quantity: parseFloat(searchValue) },
            { unit_price: parseFloat(searchValue) },
            { total: parseFloat(searchValue) },
            { vat: parseFloat(searchValue) },
            { total_inc_vat: parseFloat(searchValue) },
          ],
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchValue}%` } },
            { full_name: { [Op.iLike]: `%${searchValue}%` } },
            { id_number: { [Op.iLike]: `%${searchValue}%` } },
            { customer_subcity: { [Op.iLike]: `%${searchValue}%` } },
            { customer_woreda: { [Op.iLike]: `%${searchValue}%` } },
            { item_code: { [Op.iLike]: `%${searchValue}%` } },
            { uom: { [Op.iLike]: `%${searchValue}%` } },
            { cashier_full_name: { [Op.iLike]: `%${searchValue}%` } },
          ],
        });
      }
    }

    const salesCount = await Sales.count({
      where: {
        [Op.and]: whereConditions,
      },
    });

    const totalPages = Math.ceil(salesCount / pageSize);

    const searchResults = await Sales.findAll({
      where: {
        [Op.and]: whereConditions,
      },
      attributes: [
        'name',
        'full_name',
        'id_number',
        'customer_subcity',
        'customer_woreda',
        'item_code',
        'description',
        'uom',
        'quantity',
        'unit_price',
        'total',
        'total_for_vat_items',
        'vat',
        'total_inc_vat',
        'prepared',
        'cashier_full_name',
        'creation',
      ],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales not found.' });
    }

    if (req.user.email !== undefined) {
      await userActivity('searched to view sales data', req.user.email);
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


// //search sales attachement data
// exports.searchSales = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(401).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       if (!isNaN(searchValue)) {
//         whereConditions.push({
//           [Op.or]: [
//             {quantity: parseInt(searchValue)},
//             {unit_price: parseFloat(searchValue),},
//             {total: parseFloat(searchValue),},
//             {vat: parseFloat(searchValue),},
//             {total_inc_vat: parseFloat(searchValue),},
//           ],
//         });
//       }else{
//       whereConditions.push({
//         [Op.or]: [
//           {name: {[Op.iLike]: `%${searchValue}%`,},},
//           {full_name: {[Op.iLike]: `%${searchValue}%`,},},
//           {id_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {customer_subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {customer_woreda: {[Op.iLike]: `%${searchValue}%`,},},
//           {item_code: {[Op.iLike]: `%${searchValue}%`,},},
//           {uom: {[Op.iLike]: `%${searchValue}%`,},},
//           {cashier_full_name: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//   }
//     let searchResults = await Sales.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['name' ,'full_name' ,'id_number','customer_subcity','customer_woreda' ,'item_code','description','uom','quantity','unit_price','total','total_for_vat_items',
//       'vat','total_inc_vat','prepared','cashier_full_name', 'creation',],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Sales not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("searched to view sales data", req.user.email );
//     }
//     res.status(200).json({ success: true, users:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


//search from customer data
exports.searchCustomer = async (req, res, next) => {
  const { searchValues, page, limit } = req.query;
  if (!searchValues || searchValues.length === 0) {
    return res.status(403).json({ success: false, message: 'Please provide search values.' });
  }
  const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];

  try {
    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const searchValue of searchValueArray) {
      whereConditions.push({
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${searchValue}%` } },
          { customer_type: { [Op.iLike]: `%${searchValue}%` } },
          { code: { [Op.iLike]: `%${searchValue}%` } },
          { birth_date: { [Op.iLike]: `%${searchValue}%` } },
          { gender: { [Op.iLike]: `%${searchValue}%` } },
          { phone_number: { [Op.iLike]: `%${searchValue}%` } },
          { regionstate: { [Op.iLike]: `%${searchValue}%` } },
          { subcity: { [Op.iLike]: `%${searchValue}%` } },
          { woreda: { [Op.iLike]: `%${searchValue}%` } },
          { ketena: { [Op.iLike]: `%${searchValue}%` } },
          { house_number: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_Phone: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_registration_date: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_relation: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_birth_date: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_gender: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_code: { [Op.iLike]: `%${searchValue}%` } },
          { dependet_full_name: { [Op.iLike]: `%${searchValue}%` } },
        ],
      });
    }

    const customersCount = await Customer.count({
      where: {
        [Op.and]: whereConditions,
      },
    });

    const totalPages = Math.ceil(customersCount / pageSize);

    let searchResults = await Customer.findAll({
      where: {
        [Op.and]: whereConditions,
      },
      attributes: [
        'full_name',
        'customer_type',
        'code',
        'birth_date',
        'gender',
        'regionstate',
        'subcity',
        'woreda',
        'ketena',
        'house_number',
        'age',
      ],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    searchResults = searchResults.filter(result => result.full_name !== '' || result.code !== '');

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Data not found.' });
    }

    const creditCustomers = searchResults.filter(result => result.customer_type === 'Credit Customer');
    const cashCustomers = searchResults.filter(result => result.customer_type === 'Cash Customer');

    if (req.user.email !== undefined) {
      await userActivity('searched to view customer data', req.user.email);
    }

    res.status(200).json({
      success: true,
      cashCustomers,
      creditCustomers,
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


// //search from customer data
// exports.searchCustomer = async (req, res, next) => {
//   const { searchValues } = req.query;
//   if (!searchValues || searchValues.length === 0) {
//     return res.status(403).json({ success: false, message: 'Please provide search values.' });
//   }
//   const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];
//   console.log(searchValueArray)
//   try {
//     const whereConditions = [];
//     for (const searchValue of searchValueArray) {
//       console.log(searchValue)
//       // const lowercasedSearchValue = searchValue.toLowerCase();
//       whereConditions.push({
//         [Op.or]: [
//           {full_name: {[Op.iLike]: `%${searchValue}%`,},},
//           {customer_type: {[Op.iLike]: `%${searchValue}%`,},},
//           {code: {[Op.iLike]: `%${searchValue}%`,},},
//           {birth_date: {[Op.iLike]: `%${searchValue}%`,},},
//           {gender: {[Op.iLike]: `%${searchValue}%`,},},
//           {phone_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {regionstate: {[Op.iLike]: `%${searchValue}%`,},},
//           {subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {woreda: {[Op.iLike]: `%${searchValue}%`,},},
//           {ketena: {[Op.iLike]: `%${searchValue}%`,},},
//           {house_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_Phone: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_registration_date: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_relation: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_birth_date: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_gender: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_code: {[Op.iLike]: `%${searchValue}%`,},},
//           {dependet_full_name: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//     let searchResults = await Customer.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['full_name','customer_type', 'code', 'birth_date', 'gender', 'regionstate', 'subcity', 'woreda', 'ketena', 'house_number','age'],
//     });
//     searchResults = searchResults.filter(result => result.full_name !== '' || result.code !== '');
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Data Not found.' });
//     }
//     const creditCustomers = searchResults.filter(result => result.customer_type === 'Credit Customer');
//     const cashCustomers = searchResults.filter(result => result.customer_type === 'Credit Customer');
//     if(req.user.email !== undefined){
//       await userActivity("searched to view customer data.", req.user.email );
//     }
//     res.status(200).json({ success: true,cashCustomers,creditCustomers, customers:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


//search from branch data
exports.searchBranch = async (req, res, next) => {
  const { searchValues, page, limit } = req.query;
  if (!searchValues || searchValues.length === 0) {
    return res.status(403).json({ success: false, message: 'Please provide search values.' });
  }
  const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];

  try {
    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const searchValue of searchValueArray) {
      if (!isNaN(searchValue)) {
        whereConditions.push({
          [Op.or]: [
            { branch_number: Number(searchValue) },
            { woreda: Number(searchValue) },
          ],
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { branch_name: { [Op.iLike]: `%${searchValue}%` } },
            { subcity: { [Op.iLike]: `%${searchValue}%` } },
            { house_number: { [Op.iLike]: `%${searchValue}%` } },
            { email: { [Op.iLike]: `%${searchValue}%` } },
            { phone_number: { [Op.iLike]: `%${searchValue}%` } },
          ],
        });
      }
    }

    const branchesCount = await Branch.count({
      where: {
        [Op.and]: whereConditions,
      },
    });

    const totalPages = Math.ceil(branchesCount / pageSize);

    const searchResults = await Branch.findAll({
      where: {
        [Op.and]: whereConditions,
      },
      attributes: [
        'branch_name',
        'branch_number',
        'subcity',
        'woreda',
        'house_number',
        'email',
        'phone_number',
      ],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Data not found.' });
    }

    if (req.user.email !== undefined) {
      await userActivity('searched to view branch data', req.user.email);
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


// //search from branch data
// exports.searchBranch = async (req, res, next) => {
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
//       if (!isNaN(searchValue)) {
//         whereConditions.push({
//           [Op.or]: [
//             {branch_number: Number(searchValue),},
//             {woreda: Number(searchValue),},
//           ],
//         });
//       }else{
//       whereConditions.push({
//         [Op.or]: [
//           {branch_name: {[Op.iLike]: `%${searchValue}%`,},},
//           {subcity: {[Op.iLike]: `%${searchValue}%`,},},
//           {house_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {email: {[Op.iLike]: `%${searchValue}%`,},},
//           {phone_number: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//   }
//     const searchResults = await Branch.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['branch_name', 'branch_number', 'subcity', 'woreda', 'house_number', 'email', 'phone_number'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Data Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("searched to view branch data", req.user.email );
//     }
//     res.status(200).json({ success: true, branchs:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


//search from organization data
exports.searchOrganization = async (req, res, next) => {
  const { searchValues, page, limit } = req.query;
  if (!searchValues || searchValues.length === 0) {
    return res.status(403).json({ success: false, message: 'Please provide search values.' });
  }
  const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];

  try {
    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const searchValue of searchValueArray) {
      whereConditions.push({
        [Op.or]: [
          { organization_type: { [Op.iLike]: `%${searchValue}%` } },
          { name1: { [Op.iLike]: `%${searchValue}%` } },
          { phone: { [Op.iLike]: `%${searchValue}%` } },
          { email: { [Op.iLike]: `%${searchValue}%` } },
          { address: { [Op.iLike]: `%${searchValue}%` } },
          { subcity: { [Op.iLike]: `%${searchValue}%` } },
          { woreda: { [Op.iLike]: `%${searchValue}%` } },
          { house_number: { [Op.iLike]: `%${searchValue}%` } },
        ],
      });
    }

    const organizationsCount = await Organization.count({
      where: {
        [Op.and]: whereConditions,
      },
    });

    const totalPages = Math.ceil(organizationsCount / pageSize);

    const searchResults = await Organization.findAll({
      where: {
        [Op.and]: whereConditions,
      },
      attributes: ['organization_type', 'name1', 'phone', 'email', 'address', 'subcity', 'woreda', 'house_number'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Not found.' });
    }

    if (req.user.email !== undefined) {
      await userActivity('searched to view organization data', req.user.email);
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


// //search from organization data
// exports.searchOrganization = async (req, res, next) => {
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
//           {house_number: {[Op.iLike]: `%${searchValue}%`,},},
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
//       await userActivity("searched to view organization data", req.user.email );
//     }
//     res.status(200).json({ success: true, branchs:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


//search from product data
exports.searchProduct = async (req, res, next) => {
  const { searchValues, page, limit } = req.query;
  if (!searchValues || searchValues.length === 0) {
    return res.status(403).json({ success: false, message: 'Please provide search values.' });
  }
  const searchValueArray = Array.isArray(searchValues) ? searchValues : [searchValues];

  try {
    // Convert page and limit values to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    const whereConditions = [];
    for (const searchValue of searchValueArray) {
      const numericSearchValue = Number(searchValue);
      if (!isNaN(numericSearchValue)) {
        whereConditions.push({
          [Op.or]: [
            { vat: numericSearchValue },
            { quantity: numericSearchValue },
            { unit_selling_price: numericSearchValue },
            { total_selling_price: numericSearchValue },
          ],
        });
      } else {
        whereConditions.push({
          [Op.or]: [
            { kenema_pharmacy_drug_shop_number: { [Op.iLike]: `%${searchValue}%` } },
            { description: { [Op.iLike]: `%${searchValue}%` } },
            { item_code: { [Op.iLike]: `%${searchValue}%` } },
            { unit: { [Op.iLike]: `%${searchValue}%` } },
            { brand: { [Op.iLike]: `%${searchValue}%` } },
            { pharmacological_category: { [Op.iLike]: `%${searchValue}%` } },
            { manufacturer: { [Op.iLike]: `%${searchValue}%` } },
            { batch_number: { [Op.iLike]: `%${searchValue}%` } },
            { exp_date: { [Op.iLike]: `%${searchValue}%` } },
          ],
        });
      }
    }

    const productsCount = await Product.count({
      where: {
        [Op.and]: whereConditions,
      },
    });

    const totalPages = Math.ceil(productsCount / pageSize);

    const searchResults = await Product.findAll({
      where: {
        [Op.and]: whereConditions,
      },
      attributes: [
        'kenema_pharmacy_drug_shop_number',
        'description',
        'item_code',
        'unit',
        'brand',
        'pharmacological_category',
        'manufacturer',
        'batch_number',
        'exp_date',
        'vat',
        'quantity',
        'unit_selling_price',
        'total_selling_price',
      ],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    if (searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Not found.' });
    }

    if (req.user.email !== undefined) {
      await userActivity('searched to view product data', req.user.email);
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


// //search from product data
// exports.searchProduct = async (req, res, next) => {
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
//       const numericSearchValue = Number(searchValue);
//       if (!isNaN(numericSearchValue)) {
//         whereConditions.push({
//           [Op.or]: [
//             {vat: numericSearchValue,},
//             {quantity: numericSearchValue,},
//             {unit_selling_price: numericSearchValue,},
//             {total_selling_price: numericSearchValue,},
//           ],
//         });
//       }else{
//       whereConditions.push({
//         [Op.or]: [
//           {kenema_pharmacy_drug_shop_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {description: {[Op.iLike]:`%${searchValue}%`,}},
//           {item_code: {[Op.iLike]: `%${searchValue}%`,},},
//           {unit: {[Op.iLike]: `%${searchValue}%`,},},
//           {brand: {[Op.iLike]: `%${searchValue}%`,},},
//           {pharmacological_category: {[Op.iLike]: `%${searchValue}%`,},},
//           {manufacturer: {[Op.iLike]: `%${searchValue}%`,},},
//           {batch_number: {[Op.iLike]: `%${searchValue}%`,},},
//           {exp_date: {[Op.iLike]: `%${searchValue}%`,},},
//         ],
//       });
//     }
//   }
//     const searchResults = await Product.findAll({
//       where: {
//         [Op.and]: whereConditions,
//       },
//       attributes: ['kenema_pharmacy_drug_shop_number','description','item_code','unit','brand','pharmacological_category','manufacturer','batch_number', 'exp_date','vat','quantity','unit_selling_price','total_selling_price'],
//     });
//     if (searchResults.length === 0) {
//       return res.status(404).json({ success: false, message: 'Not found.' });
//     }
//     if(req.user.email !== undefined){
//       await userActivity("searched to view product data", req.user.email );
//     }
//     res.status(200).json({ success: true, branchs:searchResults });
//   } catch (error) {
//     console.error('Error executing search:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


