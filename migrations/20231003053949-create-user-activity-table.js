'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('User-Activities', 
      { 
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          },
        activity:{
          type: Sequelize.STRING,
          allowNull:false,
        },
        createdAt:{
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('User-Activities');
  }
};
