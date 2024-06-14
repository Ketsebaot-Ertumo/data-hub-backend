'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('Sales', { 
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        creation: {
          allowNull: true,
          type: Sequelize.STRING,
          defaultValue:''
        },
        name: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue:''
          },
        full_name: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
            },
        id_number: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        customer_subcity: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        customer_woreda: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        item_code: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        description: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        uom: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        quantity: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        unit_price: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        total_price: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        total: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        total_for_vat_items: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        vat: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        total_inc_vat: {
            type: Sequelize.DECIMAL,
            allowNull: true,
        },
        prepared: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        cashier_full_name: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
        },
    });
  },
  
  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('Sales');
  }
};
