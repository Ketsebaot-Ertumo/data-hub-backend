

module.exports = (sequelize, DataTypes) => {
    const Sales = sequelize.define('Sales', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      creation: {
        allowNull: true,
        type: DataTypes.STRING,
        defaultValue:''
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:''
        },
      full_name: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
          },
      id_number: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      customer_subcity: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      customer_woreda: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      item_code: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      description: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      uom: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      quantity: {
          type: DataTypes.DECIMAL,
          allowNull: true,
      },
      unit_price: {
          type: DataTypes.DECIMAL,
          allowNull: true,
      },
      total_price: {
        type: DataTypes.DECIMAL,
        allowNull: true,
     },
      total: {
          type: DataTypes.DECIMAL,
          allowNull: true,
      },
      total_for_vat_items: {
          type: DataTypes.DECIMAL,
          allowNull: true,
      },
      vat: {
          type: DataTypes.DECIMAL,
          allowNull: true,
      },
      total_inc_vat: {
          type: DataTypes.DECIMAL,
          allowNull: true,
      },
      prepared: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
      },
      cashier_full_name: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue:''
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
    
    return Sales;
    }
    