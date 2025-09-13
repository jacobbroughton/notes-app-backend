import indexRoutes from "./routes/index.js";
import foldersRoutes from "./routes/folders.js";
import pagesRoutes from "./routes/pages.js";
import tagsRoutes from "./routes/tags.js";
import passport from "passport";
import { sessionStore } from "./config/database.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import dotEnv from "dotenv";

dotEnv.config();
const app = express();

const origins = [
  "http://localhost:3000",
  "https://notesjb.com",
  "https://www.notesjb.com",
];

app.options("*", cors({ credentials: true, origin: origins }));
app.use(
  cors({
    credentials: true,
    origin: origins,
  })
);
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json()); 
app.use(express.static("build"));
app.use(express.urlencoded({ extended: true })); 
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    proxy: true,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : false,
    },
  })
);

import "./config/passport.js";
app.use(passport.initialize()); // initialize the middleware, makes sure it doesnt get stale
app.use(passport.session()); // allows passport to plug into sessions table

app.use("/", indexRoutes);
app.use("/folders", foldersRoutes);
app.use("/pages", pagesRoutes);
app.use("/tags", tagsRoutes);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
