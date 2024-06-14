const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('techethio', 'postgres', '63587492', {
// const sequelize = new Sequelize('KetsiTech1', 'postgres', 'yes123KE.', {
  host: 'localhost',
  dialect: 'postgres',
  logging: true, // Set to true for debugging
});



const Branch = require('../models/branchModel')(sequelize, DataTypes);
const Customer = require('../models/customerModel')(sequelize, DataTypes);
const Organization = require('../models/organizationModel')(sequelize, DataTypes);
const Product = require('../models/productModel')(sequelize, DataTypes);
const Sales = require('../models/salesModel')(sequelize, DataTypes);
const User = require('../models/userModel')(sequelize, DataTypes);
const User_Activities = require('../models/userActivityModel')(sequelize, DataTypes);
const Role_Permissions = require('../models/rpModel')(sequelize, DataTypes);
const UserRoleModel = require('../models/userRoleModel')(sequelize, DataTypes);
const Company = require('../models/companyModel')(sequelize, DataTypes);

const seedData = [];

(async () => {
  try {
    // await sequelize.sync({ force: true }); // This will drop and recreate the table
    // await Product.sync({ force: true });
    // await Sales.sync({ force: true });
    await Company.sync({ force: true });
    await User.sync({ force: true });

    // await Branch.bulkCreate(seedData);
    // await Customer.bulkCreate(seedData);
    // await Organization.bulkCreate(seedData);
    // await Product.bulkCreate(seedData);
    // await Sales.bulkCreate(seedData);
    await User.bulkCreate(seedData);
    // await User_Activities.bulkCreate(seedData);
    // await Role_Permissions.bulkCreate(seedData);
    // await UserRoleModel.bulkCreate(seedData);
    await Company.bulkCreate(seedData);

    console.log('Seed data added successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
})();
