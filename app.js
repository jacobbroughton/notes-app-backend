const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: ["https://notes-app-jb.onrender.com", "http://notes-app-jb.onrender.com", "http://localhost:3000"],
    credentials: true,
  })
)

// const rootPath = __dirname.replace('/server', '/dist')
// console.log(rootPath)

// app.use(express.static(rootPath))
// app.get('/*', function (req, res) {
//   res.sendFile(path.join(rootPath, 'index.html'))
// })

const passport = require("passport");
const { sessionStore } = require("./config/database.js");
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json()); // parsing the incoming data
app.use(express.urlencoded({ extended: true })); // parsing the incoming data
app.use(
  session({

    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    proxy: true,
    saveUninitialized: false, // allows any uninitialized session to be sent to the store. When a session is created but not modified, it is referred to as uninitialized.
    resave: false, // enables the session to be stored back to the session store, even if the session was never modified during the request.
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : false
    },


    // secret: `${process.env.SESSION_SECRET}`,
    // resave: false,
    // saveUninitialized: true,
    // store: sessionStore,
    // cookie: {
    //   secure: false,
    //   maxAge: 1000 * 60 * 60 * 24,
    // },
  })
);

require("./config/passport"); // pretty much includes the passport.use()
app.use(passport.initialize()); // initialize the middleware, makes sure it doesnt get stale
app.use(passport.session()); // allows passport to plug into sessions table

app.use("/", require("./routes"));
app.use('/folders', require("./routes/folders"));
app.use('/pages', require("./routes/pages"));
app.use('/tags', require("./routes/tags"));


const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
