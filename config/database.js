const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

console.log(process.env)


const dbOptions = {
  host:  process.env.DB_HOST_DEV,
  port: process.env.DB_PORT_DEV,
  user: process.env.DB_USER_DEV,
  password: process.env.DB_PASSWORD_DEV,
  database: process.env.DB_NAME_DEV,
};

const connection = mysql.createConnection(dbOptions);
const sessionStore = new MySQLStore(dbOptions, connection);

module.exports = {
  connection,
  sessionStore,
};
