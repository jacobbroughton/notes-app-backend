const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const dbOptions = {
  connectionLimit: 10,
  host: process.env.NODE_ENV === 'development' ? process.env.DB_HOST_DEV : process.env.DB_HOST_PROD,
  port: process.env.NODE_ENV === 'development' ? process.env.DB_PORT_DEV : process.env.DB_PORT_PROD,
  user: process.env.NODE_ENV === 'development' ? process.env.DB_USER_DEV : process.env.DB_USER_PROD,
  password: process.env.NODE_ENV === 'development' ? process.env.DB_PASSWORD_DEV : process.env.DB_PASSWORD_PROD,
  database: process.env.NODE_ENV === 'development' ? process.env.DB_NAME_DEV : process.env.DB_NAME_PROD,
  ssl: { rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true }
};

const pool = mysql.createPool(dbOptions);
const sessionStore = new MySQLStore(dbOptions, pool);

module.exports = {
  pool,
  sessionStore,
};
