'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('User-Roles', { 
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      roles: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        allowNull: false,
        // defaultValue:[ {role:"guest",granted: true},{role:"admin",granted: false}, {role:"user" ,granted: false}, {role:"sales" ,granted: false}, {role:"branch" ,granted: false},{role:"organ",granted: false}, {role:"customer",granted: false},{role:"product",granted: false} ],
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
    await queryInterface.dropTable('User-Roles');
  }
};
