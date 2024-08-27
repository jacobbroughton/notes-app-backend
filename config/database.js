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
  ...(process.env.NODE_ENV === "development"
    ? {
        host: process.env.DB_HOST_DEV,
        port: process.env.DB_PORT_DEV,
        user: process.env.DB_USER_DEV,
        password: process.env.DB_PASSWORD_DEV,
        database: process.env.DB_NAME_DEV,
      }
    : {
        connectionString: process.env.DB_CONNECTION_STRING_PROD,
      }),
  ssl: process.env.NODE_ENV === "development" ? false : { rejectUnauthorized: false },
  min: 0,
  idleTimeoutMillis: 0,
  // max: 10,
  // createTimeoutMillis: 8000,
  // acquireTimeoutMillis: 8000,
  // reapIntervalMillis: 1000,
  // createRetryIntervalMillis: 100,
};

const pool = new Pool(dbOptions);

pool.on("error", (err) => {
  console.log("Encountered error", err);
});

const sessionStore = new pgSession({
  pool: pool,
  // acquireConnectionTimeout: 5000,
  tableName: "session",
  createTableIfMissing: true,
});

export { pool, sessionStore };
