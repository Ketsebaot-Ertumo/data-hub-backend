module.exports = (sequelize, DataTypes) => {
  const RP = sequelize.define('Role_Permissions', {
        docType:{
          type: DataTypes.STRING,
          allowNull: false,
      },
      role: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
      },
        permissions: {
          type: DataTypes.ARRAY(DataTypes.JSON),
          allowNull: false,
          // defaultValue|: [],
          defaultValue:[ {permission:"read",granted: true}, {permission:"write" ,granted: false}, {permission:"edit" ,granted: false}, {permission:"delete" ,granted: false},{permission:"download",granted: false}, {permission:"import",granted: false} ],
          // set(value) {
          //   const formattedPermissions = value.map(permission => {
          //     const key = Object.keys(permission)[0].toLowerCase();
          //     // const key = Object.keys(permission)[0];
          //     const granted = permission[key];
          //     const val=permission.granted;
          //     console.log(granted)
          //     return {granted : permission.permission};
          //   });
          //   this.setDataValue('permissions', formattedPermissions);
          // },
        },
      // timestamps: false,
  });

  return RP;
}
