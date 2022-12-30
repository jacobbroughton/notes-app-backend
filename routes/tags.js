const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;
const { body } = require("express-validator");

router.get('/', isAuth, (req, res) => {
  const sql = `
    SELECT * FROM TBL_TAG
    WHERE EFF_STATUS = 1 
    AND CREATED_BY_ID = ?
    ORDER BY COLOR DESC
  `

  connection.query(sql, [req.user.ID], (err, rows) => {
    if (err) throw err

    res.send({ tags: rows, message: "Successfully fetched tags" })
  })
})

router.post('/new', isAuth, (req, res) => {
  const SEARCH_FOR_EXISTING_TAG = `
    SELECT * FROM TBL_TAG 
    WHERE NAME = ?
    AND CREATED_BY_ID = ?
  `

  connection.query(SEARCH_FOR_EXISTING_TAG, [req.body.name, req.user.ID], (err, rows) => {
    if (err) throw err

    console.log(rows)

    if (rows.length > 0) throw 'This tag already exists'

    const CREATE_TAG = `
      INSERT INTO TBL_TAG (
        NAME,
        COLOR,
        EFF_STATUS,
        CREATED_DTTM,
        MODIFIED_DTTM,
        CREATED_BY_ID,
        MODIFIED_BY_ID
      ) VALUES (
        ?,
        ?,
        1,
        SYSDATE(),
        null,
        ?,
        null
      )
    `

    connection.query(CREATE_TAG, [req.body.name, req.body.color, req.user.ID], (err, result) => {
      if (err) throw err

      if (req.body.isForItem) {
        const SELECT_JUST_CREATED_TAG = `
          SELECT * FROM TBL_TAG 
          WHERE ID = ?
        `
        connection.query(SELECT_JUST_CREATED_TAG, [result.insertId], (err, rows) => {
          if (err) throw err;

          const justAddedTag = rows[0]
          const item = req.body.item

          const ADD_TAGGED_ITEM = `
            INSERT INTO TBL_TAGGED_ITEM (
              TAG_ID,
              ITEM_ID,
              IS_PAGE,
              EFF_STATUS,
              CREATED_DTTM,
              MODIFIED_DTTM,
              CREATED_BY_ID,
              MODIFIED_BY_ID
            ) VALUES (
              ?,
              ?,
              ?,
              1,
              SYSDATE(),
              NULL,
              ?,
              NULL
            )
          `

          connection.query(ADD_TAGGED_ITEM, [
            justAddedTag.ID,
            item.IS_PAGE ? item.PAGE_ID : item.ID,
            item.IS_PAGE,
            req.user.ID
          ], (err, result) => {
            if (err) throw err

            res.send({ result, message: "Tag suggessfully added for item" })
          })
        })
      }

      if (!req.body.isForItem) {
        res.send({ result, message: "Tag successfully added" })
      }
    })

  })
})

router.post('/edit', isAuth, (req, res) => {
  const sql = `
    UPDATE TBL_TAG 
    SET
      NAME = ?,
      COLOR = ?
    WHERE ID = ?
    
  `

  connection.query(sql, [req.body.name, req.body.color, req.body.id], (err, result) => {
    if (err) throw err

    res.send({ result, message: "Tag successfully edited" })
  })
})

router.post('/delete', isAuth, (req, res) => {
  const sql = `
    UPDATE TBL_TAG 
    SET
      EFF_STATUS = 0
    WHERE ID = ?
    
  `

  connection.query(sql, [req.body.id], (err, result) => {
    if (err) throw err

    res.send({ result, message: "Tag successfully deleted" })
  })
})


module.exports = router;