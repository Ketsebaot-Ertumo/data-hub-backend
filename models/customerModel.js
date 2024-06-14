const { VIRTUAL } = require("sequelize");


module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customers', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        customer_type:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        age: {
            type: DataTypes.VIRTUAL,
            get() {
              if (this.birth_date) {
                const birthYear = new Date(this.birth_date).getFullYear();
                const currentYear = new Date().getFullYear();
                return currentYear - birthYear;
              }
              return null;
            }
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        birth_date: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        regionstate: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        subcity: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        woreda: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        ketena: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        house_number: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_full_name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_code: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_gender: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_birth_date: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_relation: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_registration_date: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        dependet_Phone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        creation: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: ''
        },
        modified: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: ''
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    });

    return Customer;
}
