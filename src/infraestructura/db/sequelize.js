const { Sequelize } = require('sequelize');
const pg = require('pg');
require('dotenv').config();

const DB_NAME = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.DB_NAME;
const DB_USER = process.env.POSTGRES_USER || process.env.PGUSER || process.env.DB_USER;
const DB_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.DB_PASSWORD;
const DB_HOST = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432);

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED;

let sequelize;
if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

async function initDb() {
  try {
    await sequelize.authenticate();
    // Usa alter para ajustar el esquema a cambios de modelos (p.ej. permitir NULL)
    await sequelize.sync({ alter: true });
    console.log('DB conectada:', DB_HOST + ':' + DB_PORT, 'DB:', DB_NAME);
  } catch (err) {
    console.error('Error inicializando DB', err);
    throw err;
  }
}

module.exports = { sequelize, initDb };