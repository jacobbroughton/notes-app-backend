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
  min: 0,
  max: 10,
  createTimeoutMillis: 8000,
  acquireTimeoutMillis: 8000,
  idleTimeoutMillis: 8000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 100,
};

const pool = new Pool(dbOptions);

const sessionStore = new pgSession({
  pool: pool,
  acquireConnectionTimeout: 5000,
  tableName: "session",
  createTableIfMissing: true,
});

export { pool, sessionStore };
