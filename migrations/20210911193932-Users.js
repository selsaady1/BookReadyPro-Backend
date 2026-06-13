'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [ queryInterface.addColumn(
      'Users',
      'stripeCustomerId',
       {
         type:Sequelize.STRING,
         unique:true
       }
     ),
     queryInterface.addColumn(
      'Users',
      'deletedAt',
      {
          type: Sequelize.DATE,
          allowNull: true,
      })
    ]
  },

  down: async (queryInterface, Sequelize) => {
    return [ queryInterface.removeColumn(
      'Users',
      'stripeCustomerId',
     ),
     queryInterface.removeColumn(
      'Users',
      'deletedAt',
     )
    ]
  }
};
