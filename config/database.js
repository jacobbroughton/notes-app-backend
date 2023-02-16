const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const dbOptions = {
  host: process.env.NODE_ENV === 'development' ? process.env.DB_HOST_DEV : process.env.DB_HOST_PROD,
  port: process.env.NODE_ENV === 'development' ? process.env.DB_PORT_DEV : process.env.DB_PORT_PROD,
  user: process.env.NODE_ENV === 'development' ? process.env.DB_USER_DEV : process.env.DB_USER_PROD,
  password: process.env.NODE_ENV === 'development' ? process.env.DB_PASSWORD_DEV : process.env.DB_PASSWORD_PROD,
  database: process.env.NODE_ENV === 'development' ? process.env.DB_NAME_DEV : process.env.DB_NAME_PROD,
};

const connection = mysql.createConnection(dbOptions);
const sessionStore = new MySQLStore(dbOptions, connection);

module.exports = {
  connection,
  sessionStore,
};
