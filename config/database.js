import pg from "pg";
import expressSession from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotEnv from "dotenv";

const { Pool } = pg;
const pgSession = connectPgSimple(expressSession);
dotEnv.config();

const pool = new Pool({
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
});

pool.on("error", (err) => {
  console.log("Encountered error", err);
});

const sessionStore = new pgSession({
  pool,
  createTableIfMissing: true,
  conString: "jdbc:postgresql://localhost:5432/notes"
});

export { pool, sessionStore };
