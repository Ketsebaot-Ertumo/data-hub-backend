'use strict';

/** @type {import('sequelize-cli').Migration} */
// /** @type {import('sequelize-cli')} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // fullName: {
      //   type: Sequelize.STRING,
      //   allowNull: true,
      // },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      // role:{
      //   type: Sequelize.STRING,
      //   allowNull: false,
      //   defaultValue: Sequelize.STRING,
      // },
      roles: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: ['guest'],
        // set(value) {
        //   if (value && Array.isArray(value)) {
        //     this.setDataValue('roles', value.map(role => role.toLowerCase()));
        //   }
        // },
      },
      compantType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      confirmationCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resetToken: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: Sequelize.STRING
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Users');
  }
};
