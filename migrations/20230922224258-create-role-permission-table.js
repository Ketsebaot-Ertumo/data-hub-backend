'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Role_Permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      docType:{
        type: Sequelize.STRING,
        allowNull: false,
    },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'guest',
    },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        allowNull: false,
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
    await queryInterface.dropTable('Role_Permissions');
  },
}
