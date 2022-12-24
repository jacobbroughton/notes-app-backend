const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;
const { body, check } = require("express-validator");

router.get("/", isAuth, (req, res) => {
  const sql = `
  SELECT * FROM TBL_PAGE
  WHERE EFF_STATUS = 1
  AND CREATED_BY_ID = ?
  `;

  connection.query(sql, [req.user.ID], (err, rows) => {
    if (err) throw err;
    res.send({ pages: rows, message: "Successfully got pages" });
  });
});

router.post("/new", isAuth, (req, res) => {
  console.log(req.body);

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
    ?,
    ?,
    ?,
    ?,
    1,
    SYSDATE(),
    null,
    ?,
    null
  )
  `;

  connection.query(
    sql,
    [
      req.body.parentFolderId,
      req.body.newPageName,
      req.body.newPageName,
      req.body.newPageBody || "",
      req.user.ID,
    ],
    (err, result) => {
      if (err) throw err;
      res.send({
        result,
        requestBody: req.body,
        message: "Successfully added a new page",
      });
    }
  );
});

router.post("/edit", isAuth, (req, res) => {
  if (!req.body.title) throw new Error("Title cannot be empty");

  const sql = `
    UPDATE TBL_PAGE
    SET 
    TITLE = ?,
    BODY = ?,
    MODIFIED_DTTM = SYSDATE()
    WHERE PAGE_ID = ?
  `;

  connection.query(
    sql,
    [
      req.body.title.replaceAll("'", "''"),
      req.body.body?.replaceAll("'", "''"),
      req.body.pageId,
    ],
    (err, result) => {
      if (err) throw err;

      const sql = `
      SELECT * 
      FROM TBL_PAGE
      WHERE PAGE_ID = ?
      AND EFF_STATUS = 1
    `;

      connection.query(sql, [req.body.pageId], (err, rows) => {
        if (err) throw err;

        res.send({ modifiedPage: rows[0], message: "Successfully edited page" });
      });
    }
  );
});

router.post("/updateParentFolder", isAuth, (req, res) => {
  let newFolderId;

  if (req.body.droppedOntoItem.TIER === 0) {
    newFolderId = null;
  } else {
    newFolderId = req.body.droppedOntoItem?.ID
      ? req.body.droppedOntoItem?.ID
      : req.body.droppedOntoItem?.FOLDER_ID;
  }

  const sql = `
    UPDATE TBL_PAGE
    SET FOLDER_ID = ${newFolderId}
    WHERE PAGE_ID = ${req.body.affectedPage?.PAGE_ID}
  `;

  connection.query(sql, (err, result) => {
    if (err) throw err;

    res.send({ result, message: "Successfully updated parent folder id" });
  });
});

router.post("/delete", isAuth, (req, res) => {
  const sql = `
  UPDATE TBL_PAGE
  SET EFF_STATUS = 0
  WHERE PAGE_ID = ?
`;

  connection.query(sql, [req.body.pageId], (err, result) => {
    if (err) throw err;

    res.send({ result, message: "Successfully deleted page" });
  });
});

router.post("/delete-multiple", isAuth, (req, res) => {

  const pageIdsForDelete = req.body.pages.map(page => page.PAGE_ID)

  console.log(pageIdsForDelete)

  const sql = `
    UPDATE TBL_PAGE
    SET EFF_STATUS = 0
    WHERE PAGE_ID IN (?)
  `

  console.log(sql)

  connection.query(sql, [[...pageIdsForDelete]], (err, result) => {
    if (err) throw err;
    res.send({ result, deletedPageIds: pageIdsForDelete, message: "Successfully deleted multiple pages" })
  })
})

router.post("/rename", isAuth, (req, res) => {
  const sql = `
  UPDATE TBL_PAGE
  SET NAME = ?
  WHERE PAGE_ID = ?
  `
  console.log(sql)
  connection.query(sql, [req.body.newName, req.body.pageId], (err, result) => {
    if (err) throw err;
    res.send({ result, message: "Successfully renamed page" })
  });
});

module.exports = router;
