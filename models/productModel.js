

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Products', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    kenema_pharmacy_drug_shop_number: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    item_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    pharmacological_category:{
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    batch_number: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    exp_date: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    },
    vat: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    unit_selling_price: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    total_selling_price: {
      type: DataTypes.DECIMAL,
      allowNull: true,
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
  
  return Product;
  }
  