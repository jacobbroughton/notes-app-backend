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
    successRedirect: "/",
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
                '${req.body.username}',
                '${hash}',
                '${salt}',
                SYSDATE(), 
                null
            )
        `,
        (err, result, fields) => {
          if (err) throw err;
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
  res.send({ result: "You made it to the admin route", user: req.user });
});

router.get("/login-failure", (req, res) => {
  res.send({ result: "Login failed", user: req.user });
});

// Removes req.session.passport.user property from session
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) throw err
    req.session.destroy()
    res.clearCookie('connect.sid')
    res.send({ message: "Logged out successfully" })
  })
});


// router.post('/folders/new', isAuth, (req, res, next) => {
//   connection.query(`
//     INSERT INTO TBL_FOLDER (
//       PARENT_FOLDER_ID,
//       NAME,
//       EFF_STATUS,
//       PINNED_STATUS,
//       CREATED_DTTM,
//       MODIFIED_DTTM,
//       CREATED_BY_ID,
//       MODIFIED_BY_ID
//     ) VALUES (
//       ${req.body.parentFolderId},
//       '${req.body.newFolderName}',
//       true,
//       false,
//       SYSDATE(),
//       null,
//       ${req.user.ID},
//       null
//     )
//   `, (err, result) => {
//     if (err) throw err
//     res.send({ message: 'Successfully added folder' })
//   })
// })

// router.get('/folders', (req, res) => {
//   connection.query(`
//   SELECT * FROM TBL_FOLDER
//   WHERE EFF_STATUS = 1
//   AND CREATED_BY_ID = ${req.user.ID}
//   `, (err, rows) => {
//     if (err) throw err
//     res.send({ folders: rows })
//   }) 
// })

module.exports = router;
