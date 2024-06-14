

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branches', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    branch_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branch_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subcity: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    woreda: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    house_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      set(value) {
        if (value) {
          this.setDataValue('email', value.toLowerCase());
        }
      },
    },
    phone_number: {
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

  return Branch;
}