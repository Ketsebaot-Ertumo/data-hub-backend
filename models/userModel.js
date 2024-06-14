const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('Users', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        if (value) {
          this.setDataValue('email', value.toLowerCase());
        }
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // role: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    //   defaultValue: 'user',
    // },
    roles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['guest'],
      // set(value) {
      //   if (value && Array.isArray(value)) {
      //     this.setDataValue('roles', value.map(role => role.toLowerCase()));
      //   }
      // },
      // set(value) {
      //   if (value) {
      //     const lowercasedRoles = value.map(role => role.toLowerCase());
      //     this.setDataValue('roles', lowercasedRoles);
      //   }
      // },
    },
    compantType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    confirmationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
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

  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await bcryptjs.hash(user.password, 10);
    }
    // user.fullName = user.firstName + ' ' + user.lastName;
  });

  User.prototype.comparePassword = async function (enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.password);
  };

  User.prototype.getJwtToken = function () {
    // return jwt.sign({ id: this.id,fullName: this.fullName, email:this.email, role: this.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return jwt.sign({ id: this.id, firstName: this.firstName, email:this.email, roles: this.roles, compantType: this.compantType}, process.env.JWT_SECRET, { expiresIn: '8hr' });
  };

  return User;
}