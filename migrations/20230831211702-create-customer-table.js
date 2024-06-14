'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('Customers', { 
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        customer_type:{
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ''
        },
        full_name: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
            },
        code: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        birth_date: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        gender: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        phone_number: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        regionstate: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        subcity: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: ''
        },
        woreda: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        ketena: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        house_number: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_full_name: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        dependet_code: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        dependet_gender: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        dependet_birth_date: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        dependet_relation: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        dependet_registration_date: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue:''
        },
        dependet_Phone: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: ''
        },
        creation: {
            allowNull: true,
            type: Sequelize.STRING,
            defaultValue:''
        },
        modified: {
            allowNull: true,
            type: Sequelize.STRING,
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

     await queryInterface.dropTable('Customers');
  }
};
