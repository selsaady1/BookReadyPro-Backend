'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
  return[
    queryInterface.addColumn(
      'OutputFiles',
      'deletedAt',
      {
          type: Sequelize.DATE,
          allowNull: true,
      }),
      queryInterface.addColumn(
        'Files',
        'deletedAt',
        {
            type: Sequelize.DATE,
            allowNull: true,
        })
  ]
  },

  down: async (queryInterface, Sequelize) => {
    return [ queryInterface.removeColumn(
      'OutputFiles',
      'deletedAt',
     ),
     queryInterface.removeColumn(
      'Files',
      'deletedAt',
     )
    ]
  }
};
