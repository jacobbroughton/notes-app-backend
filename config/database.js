import pg from "pg";
import expressSession from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotEnv from "dotenv";

const { Pool } = pg;
const pgSession = connectPgSimple(expressSession);
dotEnv.config();

console.log(process.env.NODE_ENV);

const dbOptions = {
  // connectionLimit: 10,
  host:
    process.env.NODE_ENV === "development"
      ? process.env.DB_HOST_DEV
      : process.env.DB_HOST_PROD,
  port:
    process.env.NODE_ENV === "development"
      ? process.env.DB_PORT_DEV
      : process.env.DB_PORT_PROD,
  user:
    process.env.NODE_ENV === "development"
      ? process.env.DB_USER_DEV
      : process.env.DB_USER_PROD,
  password:
    process.env.NODE_ENV === "development"
      ? process.env.DB_PASSWORD_DEV
      : process.env.DB_PASSWORD_PROD,
  database:
    process.env.NODE_ENV === "development"
      ? process.env.DB_NAME_DEV
      : process.env.DB_NAME_PROD,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 0
};

const pool = new Pool(dbOptions);

// try {
//   await pool.connect();
//   console.log("Connected to database");
// } catch (error) {
//   console.error("Error connecting to the database: ", error.message);
// }

const sessionStore = new pgSession({
  pool: pool,
  tableName: "sessions",
  createTableIfMissing: true,
  // Insert connect-pg-simple options here
});

export { pool, sessionStore };
