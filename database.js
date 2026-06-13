const { Sequelize } = require('sequelize');
const user = process.env.database_user
const host = process.env.database_host
const password = process.env.database_password
const database = process.env.database_name

const sequelize = new Sequelize(database, user, password, {
    host: host,
    dialect: 'postgres',
    dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true
    }
  }
  });


async function testConnection(){
  try {
    await sequelize.authenticate();
    console.log('Connection has been established to DB successfully.');

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
  testConnection()
module.exports = sequelize
