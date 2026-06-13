'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.File,{
        foreignKey:'userId'
      })
      User.hasMany(models.OutputFile,{
        foreignKey:'userId'
      })
    }
  };
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    credit: DataTypes.DOUBLE,
    stripeCustomerId:DataTypes.STRING,
    utmSource:DataTypes.STRING,
    utmMedium:DataTypes.STRING,
    utmCampaign:DataTypes.STRING
  }, {
    sequelize,
    timestamps: true,
    modelName: 'User',
    paranoid:true
  });
  return User;
};