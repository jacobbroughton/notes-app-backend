const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const pool = require("../config/database").pool;
const isAuth = require("../authMiddleware").isAuth;
const isAdmin = require("../authMiddleware").isAdmin;

router.get("/", isAuth, (req, res) => {
  res.send({ message: "You're logged in", user: req.user });
});

router.post(
  "/login",
  passport.authenticate('local'),
  function(req, res) {
    res.json({ user: req.user, message: 'Logged in successfully' });
  }
);

router.post("/register", (req, res) => {
  try {
    let sql = `
          select * from users
          where username = $1
        `;

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

      let sql = `
            insert into users (
                username,
                hash,
                salt,
                created_dttm,
                modified_dttm
            ) values (
                $1,
                $2,
                $3,
                now(), 
                null
            )
        `;

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
