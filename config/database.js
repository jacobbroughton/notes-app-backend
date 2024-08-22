const {Pool} = require("pg")
const fs = require("fs")
const expressSession = require("express-session")
const pgSession = require("connect-pg-simple")(expressSession)
require("dotenv").config();

console.log(process.env.NODE_ENV)

const dbOptions = {
  connectionLimit: 10,
  host: process.env.NODE_ENV === 'development' ? process.env.DB_HOST_DEV : process.env.DB_HOST_PROD,
  port: process.env.NODE_ENV === 'development' ? process.env.DB_PORT_DEV : process.env.DB_PORT_PROD,
  user: process.env.NODE_ENV === 'development' ? process.env.DB_USER_DEV : process.env.DB_USER_PROD,
  password: process.env.NODE_ENV === 'development' ? process.env.DB_PASSWORD_DEV : process.env.DB_PASSWORD_PROD,
  database: process.env.NODE_ENV === 'development' ? process.env.DB_NAME_DEV : process.env.DB_NAME_PROD,
  // ssl: { rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true }
};

const pool = new Pool(dbOptions);

try {
  pool.connect()
  console.log("Connected to database")
} catch(error) {
  console.error("Error connecting to the database: ", error.message)
}

const sessionStore = new pgSession({
  pool : pool, 
  tableName : 'sessions' ,
  createTableIfMissing: true
  // Insert connect-pg-simple options here
})

module.exports = {
  pool,
  sessionStore,
};
