const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const validatePassword = require("../lib/passwordUtils").validatePassword;
const connection = require("./database").connection;

// In case you dont want 'username' and 'password'
// const customFields = {
//   usernameField: "uname",
//   passwordField: "pw",
// };

// done is a function that i'll eventually pass the results of the authentication to
const verifyCallback = (username, password, done) => {
  try {
    let user; // Find user in db here

    connection.query(
      `
      SELECT * FROM notesApp.TBL_USER
      WHERE USERNAME = ?
    `,
      [username],
      (err, result, fields) => {
        if (err) throw err;

        user = result[0];

        if (!user) {
          return done(null, false);
        }

        const isValid = validatePassword(password, user.HASH, user.SALT);

        if (isValid) {
          return done(null, user);
        } else {
          console.log("Incorrect password");
          return done(null, false);
        }
      }
    );
  } catch (err) {
    done(err);
  }
};

const strategy = new LocalStrategy(
  { usernameField: "username", passwordField: "password" },
  verifyCallback
);

passport.use(strategy);

// Grabs user from database and stores it in req.session.passport.user
// Determines which data of the user object should be stored in the session.
passport.serializeUser((user, done) => {
  // The user id argument is saved in the session and is later used
  // to retrieve the whole object via the deserializeUser function.
  done(null, user.ID);
});

// Grabs user from session
passport.deserializeUser((userId, done) => {
  connection.query(
    `
    SELECT * FROM notesApp.TBL_USER
    WHERE ID = ?
  `,
    [userId],
    (err, result) => {
      if (err) done(err);

      const user = result[0];

      done(null, user); // attaches user to req.user
    }
  );
});