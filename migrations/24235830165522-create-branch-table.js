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
    await queryInterface.createTable('Branches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      branch_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      branch_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subcity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      woreda: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      house_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      },
      phone_number: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('Branches');
  }
};
