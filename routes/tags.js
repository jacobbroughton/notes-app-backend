const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
const { body } = require("express-validator");

async function getTags(reqUserId) {
  const sql = `
    SELECT * FROM TBL_TAG
    WHERE EFF_STATUS = 1 
    AND CREATED_BY_ID = ?
    ORDER BY COLOR DESC
  `

  return query(sql, [reqUserId])
}

router.get('/', isAuth, async (req, res) => {
  try {

    let tags = await getTags(req.user.ID)

    res.send({ tags, message: "Successfully fetched tags" })

  } catch (e) {
    console.log(err)
  }
})

router.post('/new', isAuth, async (req, res) => {
  try {

    const SEARCH_FOR_EXISTING_TAG = `
      SELECT * FROM TBL_TAG 
      WHERE NAME = ?
      AND CREATED_BY_ID = ?
    `

    let [existingTag] = await query(SEARCH_FOR_EXISTING_TAG, [req.body.name, req.user.ID])

    if (existingTag) throw 'This tag already exists'

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

    let result = await query(CREATE_TAG, [req.body.name, req.body.color, req.user.ID])

    if (!result) throw 'There was an error creating the tag'

    const SELECT_JUST_CREATED_TAG = `
          SELECT * FROM TBL_TAG 
          WHERE ID = ?
        `

    const [justCreatedTag] = await query(SELECT_JUST_CREATED_TAG, [result.insertId])
    const itemFromRequest = req.body.item

    if (req.body.isForItem) {

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

      await query(ADD_TAGGED_ITEM, [
        justCreatedTag.ID,
        itemFromRequest.IS_PAGE ? itemFromRequest.PAGE_ID : itemFromRequest.ID,
        itemFromRequest.IS_PAGE,
        req.user.ID
      ])
    }

    res.send({
      result,
      justCreatedTag,
      message: "Tag successfully added"
    })


  } catch (err) {
    console.log(err)
  }

})

router.post('/edit', isAuth, async (req, res) => {
  try {
    const sql = `
      UPDATE TBL_TAG 
      SET
        NAME = ?,
        COLOR = ?
      WHERE ID = ?
    `

    const result = await query(sql, [req.body.name, req.body.color, req.body.id])
    res.send({ result, message: "Tag successfully edited" })

  } catch (err) {
    console.log(err)
  }


})

router.post('/delete', isAuth, async (req, res) => {
  try {
    const sql = `
      UPDATE TBL_TAG 
      SET
        EFF_STATUS = 0
      WHERE ID = ?
      
    `

    const result = await query(sql, [req.body.id])
    res.send({ result, message: "Tag successfully deleted" })
  } catch (err) {
    console.log(err)
  }

})


module.exports = router;