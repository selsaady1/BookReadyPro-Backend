'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      File.hasMany(models.OutputFile,{
        foreignKey:'parentFileId',
        as:'children'
      })
    }
  };
  File.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    userId:DataTypes.INTEGER,
    error:DataTypes.STRING,
    hash:DataTypes.STRING
  }, {
    sequelize,
    timestamps: true,
    modelName: 'File',
    paranoid:true
  });
  return File;
};