const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const validatePassword = require("../lib/passwordUtils").validatePassword;
const pool = require("./database").pool;

// In case you dont want 'username' and 'password'
// const customFields = {
//   usernameField: "uname",
//   passwordField: "pw",
// };


const strategy = new LocalStrategy(
  { usernameField: "username", passwordField: "password" },
  (username, password, done) => {
    try {

      let sql

      if (process.env.NODE_ENV === 'production') {
        sql = `
          SELECT * FROM \`notes-app\`.TBL_USER
          WHERE USERNAME = ?
        `
      } else {
        sql = `
          SELECT * FROM notesApp.TBL_USER
          WHERE USERNAME = ?
        `
      }

      pool.query(
        sql,
        [username],
        (err, rows) => {
          if (err) throw err;
          if (!rows[0]) return done(null, false);

          const isValid = validatePassword(password, rows[0].HASH, rows[0].SALT);

          if (isValid) {
            return done(null, rows[0]);
          }
          return done(null, false, {
            message: 'Username or password is incorrect'
          });

        }
      );
    } catch (err) {
      done(err);
    }
  }
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

  let sql

  if (process.env.NODE_ENV === 'production') {
    sql = `
      SELECT * FROM \`notes-app\`.TBL_USER
      WHERE ID = ?
    `
  } else {
    sql = `
      SELECT * FROM notesApp.TBL_USER
      WHERE ID = ?
    `
  }

  pool.query(
    sql,
    [userId],
    (err, result) => {
      if (err) {
        console.log(err)
        done(err, false, { error: err })
      };

      const user = result[0];

      done(null, user); // attaches user to req.user
    }
  );
});
