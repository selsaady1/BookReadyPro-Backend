const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established to DB successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
testConnection();
module.exports = sequelize;
