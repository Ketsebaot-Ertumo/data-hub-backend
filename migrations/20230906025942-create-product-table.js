'use strict';


/** @type {import('sequelize-cli').Migration} */
// /** @type {import('sequelize-cli')} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      kenema_pharmacy_drug_shop_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
        description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      item_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pharmacological_category:{
        type: Sequelize.STRING,
        allowNull: true,
      },
      manufacturer: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: ''
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      exp_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vat: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      unit_selling_price: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      total_selling_price: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      creation: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      modified: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Products');
  }
};
