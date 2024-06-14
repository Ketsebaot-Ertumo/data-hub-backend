

module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notifications', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      title: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      body: {
        type: DataTypes.STRING,
        allowNull: false,
     },
      email: {
          type: DataTypes.STRING,
          allowNull: false,
          set(value) {
            if (value) {
              this.setDataValue('email', value.toLowerCase());
            }
          },
      }, 
      isRead:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isSelected:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
          allowNull: false,
          type: DataTypes.DATE
      },
      updatedAt: {
          allowNull: false,
          type: DataTypes.DATE
      }
    });
  
    return Notification;
  }