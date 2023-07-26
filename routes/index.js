const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const pool = require("../config/database").pool;
const isAuth = require("../authMiddleware").isAuth;
const isAdmin = require("../authMiddleware").isAdmin;

router.get("/", isAuth, (req, res) => {
  res.send({ message: "You're logged in", user: req.user });
});

router.post("/login", (req, res, next) => {
  console.log("Hello");
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      res.statusMessage = '"Error while logging in, please try again."';
      res.status(401).end();
    }
    if (!user) {
      res.statusMessage = "Username or password is incorrect";
      res.status(401).end();
    } else {
      req.login(user, (error) => {
        if (error) {
          res.statusMessage = "User does exist, but there was an error...";
          res.status(401).end();
        } else {
          res.redirect("/");
        }
      });
    }
  })(req, res, next);
});

router.post("/register", (req, res) => {
  try {
    let sql;

    if (process.env.NODE_ENV === "production") {
      sql = `
          SELECT * FROM \`notes-app\`.TBL_USER
          WHERE USERNAME = ?
        `;
    } else {
      sql = `
          SELECT * FROM notesApp.TBL_USER
          WHERE USERNAME = ?
        `;
    }

    pool.query(sql, [req.body.username], (error, result, fields) => {
      if (error) {
        console.log(error);
        res.statusMessage = error.message;
        res.status(409).end();
        return;
      }

      if (result.length) {
        res.send({
          code: 2,
          message: "User already exists",
          user: null,
        });
        res.statusMessage = "User already exists";
        res.status(409).end();
        return;
      }

      const saltHash = genPassword(req.body.password);

      const salt = saltHash.salt;
      const hash = saltHash.hash;

      let sql;

      if (process.env.NODE_ENV === "production") {
        sql = `
            INSERT INTO \`notes-app\`.TBL_USER (
                USERNAME,
                HASH,
                SALT,
                CREATED_DTTM,
                MODIFIED_DTTM
            ) VALUES (
                ?,
                ?,
                ?,
                SYSDATE(), 
                null
            )
        `;
      } else {
        sql = `
              INSERT INTO notesApp.TBL_USER (
                  USERNAME,
                  HASH,
                  SALT,
                  CREATED_DTTM,
                  MODIFIED_DTTM
              ) VALUES (
                  ?,
                  ?,
                  ?,
                  SYSDATE(), 
                  null
              )
          `;
      }

      // Save the user to the database
      pool.query(sql, [req.body.username, hash, salt], (error, result, fields) => {
        if (error) {
          res.statusMessage = error.message || error.sqlMessage;
          res.status(409).end();
          return;
        }
        res.send({ result, message: "Successfully registered" });
      });
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/protected-route", isAuth, (req, res) => {
  res.send({ message: "You made it to the protected route", user: req.user });
});

router.get("/admin-route", isAdmin, (req, res) => {
  res.send({ message: "You made it to the admin route", user: req.user });
});

// Removes req.session.passport.user property from session
router.get("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      res.statusMessage = "There was an error logging out";
      res.status(409).end();
      return;
    }
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.send({ message: "Logged out successfully" });
  });
});

module.exports = router;
