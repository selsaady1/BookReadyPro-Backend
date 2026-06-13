'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OutputFile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  OutputFile.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    userId:DataTypes.INTEGER,
    parentFileId:DataTypes.INTEGER
  }, {
    sequelize,
    timestamps: true,
    modelName: 'OutputFile',
    paranoid:true

  });
  return OutputFile;
};