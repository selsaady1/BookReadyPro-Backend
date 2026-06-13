'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Transaction.init({
    paymentId: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    amount:DataTypes.FLOAT,
    status:DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName:'Transactions',
    timestamps: true,
    paranoid:true
  });
  return Transaction;
};