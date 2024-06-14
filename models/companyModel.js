

module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Companies', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    legal_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ''
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
  },
    code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ''
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
        set(value) {
            if (value) {
              this.setDataValue('email', value.toLowerCase());
            }
          },
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    POB: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    FAX: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    subcity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    woreda: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    kebele: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    house_number: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:'Ethiopia'
    }, 
    regNo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    TIN: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    Licence_number: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    dateRegistration: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    paid_capital: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    businessIn: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    // siteID: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    //   defaultValue: ''
    // },
    createdAt: {
        allowNull: false,
        type: DataTypes.DATE
    },
    updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
    }
  });

  return Company;
}