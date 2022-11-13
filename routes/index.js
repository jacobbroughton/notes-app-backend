const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;

router.get("/", isAuth, (req, res) => {
  res.send({ message: "You're logged in", user: req.user });
});

// passport.authenticate basically gives 'username' and 'password' and executes the verifyCallback function
// Only continues past to the callback if authenticated with a user
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/protected-route",
    failureRedirect: "/login-failure",
  })
);

router.post("/register", (req, res) => {
  connection.query(
    `
        SELECT * FROM notesApp.TBL_USER
        WHERE USERNAME = '${req.body.username}'
    `,
    (err, result, fields) => {
      if (err) console.log(err);

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
                '${req.body.username}',
                '${hash}',
                '${salt}',
                SYSDATE(), 
                SYSDATE()
            )
        `,
        (err, result, fields) => {
          if (err) console.log(err);
          console.log(result);
          res.send({ result: "Successfully registered" });
        }
      );
    }
  );
});

router.get("/protected-route", isAuth, (req, res) => {
  res.send({ result: "You made it to the protected route", user: req.user });
});

router.get("/admin-route", isAdmin, (req, res) => {
  //   if (!req.isAuthenticated()) {
  //     console.log("Not authenticated!");
  //     return;
  //   }
  res.send({ result: "You made it to the admin route", user: req.user });
});

router.get("/login-failure", isAuth, (req, res) => {
  //   if (!req.isAuthenticated()) {
  //     console.log("Not authenticated!");
  //     return;
  //   }
  res.send({ result: "Login failed", user: req.user });
});

// Removes req.session.passport.user property from session
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.send({ result: "Successfully logged out" });
    }
  });
});

module.exports = router;
