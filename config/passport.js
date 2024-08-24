import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { validatePassword } from "../lib/passwordUtils.js";
import { pool } from "./database.js";

const strategy = new LocalStrategy(
  { usernameField: "username", passwordField: "password" },
  async (username, password, done) => {
    try {
      let sql = `
         select * from users
          where username = $1
        `;

      await pool.query(sql, [username], (err, result) => {
        if (err) {
          console.log(err);
          throw err;
        }

        const user = result.rows[0];

        if (!user) {
          return done(null, false);
        }

        console.log("Wassup");
        const isValid = validatePassword(password, user.hash, user.salt);

        // bcrypt.compare(password, user.password, (err, res) => {
        //   if (res) {
        //     return done(null, user);
        //   } else {
        //     return done(null, false, { message: 'Incorrect password.' });
        //   }
        // });

        if (isValid) {
          console.log("Yep");
          return done(null, user);
        }
        return done(null, false, {
          message: "Username or password is incorrect",
        });
      });
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
  done(null, user.id);
});

// Grabs user from session
passport.deserializeUser((userId, done) => {
  let sql = `
      select * from users
      where id = $1
    `;

  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("SQL ERROR - ", err);
      done(err, false, { error: err });
    }

    const user = result.rows[0];

    done(null, user); // attaches user to req.user
  });
});
