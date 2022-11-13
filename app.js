const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mysql = require("mysql");
const passport = require("passport");
const crypto = require("crypto");
const sessions = require("express-session");
require("dotenv").config();
const { connection, sessionStore } = require("./config/database.js");

const app = express();
const port = process.env.PORT || 3001;

// const dbOptions = {
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// };

// const connection = mysql.createConnection(dbOptions);

app.use(
  sessions({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false, // allows any uninitialized session to be sent to the store. When a session is created but not modified, it is referred to as uninitialized.
    resave: false, // enables the session to be stored back to the session store, even if the session was never modified during the request.
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day
      secure: false,
    },
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json()); // parsing the incoming data
app.use(express.urlencoded({ extended: true })); // parsing the incoming data
app.use(cookieParser());
require("./config/passport"); // pretty much includes the passport.use()
app.use(passport.initialize()); // initialize the middleware, makes sure it doesnt get stale
app.use(passport.session()); // allows passport to plug into sessions table
app.use((req, res, next) => {
  console.log('req.sessionID', req.sessionID)
  console.log('req.session', req.session)
  console.log('req.user', req.user)
  next() // Call this so it doesnt 'crash the routes'
})
app.use(require("./routes"));

//serving public file
// app.use(express.static(__dirname));

// const myUsername = "JacobBroughton";
// const myPassword = "password23";
// let session;

// app.get("/", isAuth, (req, res) => {
//   res.send({ message: "You're logged in" })
// });

// app.post("/login", (req, res) => {
//   console.log(req.session);
//   if (req.session.username) {
//     res.send({ result: "You're already logged in", session: req.session });
//     return;
//   }
//   if (req.body.username == myUsername && req.body.password == myPassword) {
//     req.session.username = req.body.username;
//     res.send({ result: "You logged in", session: req.session });
//   } else {
//     res.send({ result: "Invalid username or password", session: req.session });
//   }
// });

// app.get("/logout", (req, res) => {
//   console.log(req.session);
//   req.session.destroy();
//   res.send({ result: "You logged out", session: req.session });
// });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
