const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
require("./config/passport"); // pretty much includes the passport.use()
const { sessionStore } = require("./config/database.js");

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: ["https://notes-app-jb.netlify.app", "http://localhost:3000"],
    credentials: true,
  })
)


let origin
if (process.env.NODE_ENV === "production") {
  origin = "https://notes-app-jb.netlify.app"
} else {
  origin = "http://localhost:3000"
}

app.use(express.json()); // parsing the incoming data
app.use(express.urlencoded({ extended: true })); // parsing the incoming data
app.use(cookieParser());
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false, // allows any uninitialized session to be sent to the store. When a session is created but not modified, it is referred to as uninitialized.
    resave: false, // enables the session to be stored back to the session store, even if the session was never modified during the request.
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day
      secure: process.env.NODE_ENV === 'production' ? true : false,
    },
    httpOnly: true
  })
);
app.use(passport.initialize()); // initialize the middleware, makes sure it doesnt get stale
app.use(passport.session()); // allows passport to plug into sessions table

app.use("/", require("./routes"));
app.use('/folders', require("./routes/folders"));
app.use('/pages', require("./routes/pages"));
app.use('/tags', require("./routes/tags"));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
