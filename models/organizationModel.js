

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organizations', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    organization_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
      name1: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
  },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        if (value) {
          this.setDataValue('email', value.toLowerCase());
        }
      },
    },
    address: {
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
    house_number: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    creation: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    modified: {
      allowNull: true,
      type: DataTypes.STRING,
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
  
  return Organization;
  }
  