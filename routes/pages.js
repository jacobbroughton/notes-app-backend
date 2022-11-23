const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;

router.get("/", isAuth, (req, res) => {
  const sql = `
  SELECT * FROM TBL_PAGE
  WHERE EFF_STATUS = 1
  AND CREATED_BY_ID = ${req.user.ID}
  `;

  connection.query(sql, (err, rows) => {
    if (err) throw err
    res.send({ pages: rows, message: "Successfully got pages" })
  });
});

router.post("/new", isAuth, (req, res) => {
  const sql = `
  INSERT INTO TBL_PAGE (
    FOLDER_ID,
    NAME,
    TITLE,
    BODY,
    EFF_STATUS,
    CREATED_DTTM,
    MODIFIED_DTTM,
    CREATED_BY_ID,
    MODIFIED_BY_ID
  ) VALUES (
    ${req.body.parentFolderId},
    '${req.body.newPageName}',
    '',
    '',
    1,
    SYSDATE(),
    null,
    ${req.user.ID},
    null
  )
  `;

  connection.query(sql, (err, result) => {
    if (err) throw err;
    res.send({ result, message: "Successfully added a new note" });
  });
});


router.post("/delete", isAuth, (req, res, next) => {
  const sql = `
  UPDATE TBL_PAGE
  SET EFF_STATUS = 0
  WHERE PAGE_ID = ${req.body.pageId}
`;

  connection.query(sql, (err, result) => {
    if (err) throw err;

    res.send({ result, message: 'Successfully deleted page' })
  });
});

module.exports = router;
