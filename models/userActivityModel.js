
module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define('User-Activities', {
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    activity:{
        type: DataTypes.STRING,
        allowNull:false,
    },
    createdAt:{
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });

  return Activity;
}