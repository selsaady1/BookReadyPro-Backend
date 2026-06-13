'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     return [ queryInterface.addColumn(
      'Users',
      'utmSource',
       {
         type:Sequelize.STRING,
         allowNull: true,
        }
     ),
     queryInterface.addColumn(
      'Users',
      'utmMedium',
      {
          type: Sequelize.STRING,
          allowNull: true,
      }),
     queryInterface.addColumn(
      'Users',
      'utmCampaign',
      {
          type: Sequelize.STRING,
          allowNull: true,
      })
    ]
  },

  down: async (queryInterface, Sequelize) => {
    return [
     queryInterface.removeColumn(
      'Users',
      'utmSource',
     ),
     queryInterface.removeColumn(
      'Users',
      'utmCampaign',
     ),
     queryInterface.removeColumn(
      'Users',
      'utmMedium',
     ),
    ]
  }
};
