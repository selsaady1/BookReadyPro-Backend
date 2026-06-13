'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     return [ queryInterface.addColumn(
      'Files',
      'hash',
       {
         type:Sequelize.STRING,
         allowNull: true,
        }
     ),
     queryInterface.addIndex('Files', ['hash','error','userId'], {
      name: 'idx_files_hash'
     })
      ]
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return [
      queryInterface.removeColumn(
       'Files',
       'hash',
      ),
      queryInterface.removeIndex(
        'Files',
        ['hash','error','userId']
       ),
       
    ]
  }
};
