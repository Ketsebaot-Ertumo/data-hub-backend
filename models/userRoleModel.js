
module.exports = (sequelize, DataTypes) => {
  const UR = sequelize.define('User-Roles', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
            if (value) {
              this.setDataValue('email', value.toLowerCase());
            }
          },
      },
      roles: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull: false,
        defaultValue:[ {role:"guest",granted: true},{role:"admin",granted: false}, {role:"user" ,granted: false}, {role:"sales" ,granted: false}, {role:"branch" ,granted: false},{role:"organ",granted: false}, {role:"customer",granted: false},{role:"product",granted: false} ],
      },
      createdAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
  });



  return UR;
}