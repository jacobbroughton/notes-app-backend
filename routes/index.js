const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;
const { body } = require("express-validator");

router.get("/", isAuth, (req, res) => {
  res.send({ message: "You're logged in", user: req.user });
});

// passport.authenticate basically gives 'username' and 'password' and executes the verifyCallback function
// Only continues past to the callback if authenticated with a user
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login-failure",
  })
);

router.post("/register", (req, res) => {
  connection.query(
    `
        SELECT * FROM notesApp.TBL_USER
        WHERE USERNAME = ?
    `,
    [req.body.username],
    (err, result, fields) => {
      if (err) throw err;

      if (result.length) {
        res.status(400).send({ message: "User already exists" });
        return;
      }

      const saltHash = genPassword(req.body.password);

      const salt = saltHash.salt;
      const hash = saltHash.hash;

      // Save the user to the database
      connection.query(
        `
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
        `,
        [req.body.username, hash, salt],
        (err, result, fields) => {
          if (err) throw err;
          res.send({ result, message: "Successfully registered" });
        }
      );
    }
  );
});

router.get("/protected-route", isAuth, (req, res) => {
  res.send({ message: "You made it to the protected route", user: req.user });
});

router.get("/admin-route", isAdmin, (req, res) => {
  res.send({ message: "You made it to the admin route", user: req.user });
});

router.get("/login-failure", (req, res) => {
  res.send({
    message: "Login failed, please check your username and password and try again.",
    user: req.user,
  });
});

// Removes req.session.passport.user property from session
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) throw err;
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.send({ message: "Logged out successfully" });
  });
});

module.exports = router;