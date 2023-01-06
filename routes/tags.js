const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
const { body } = require("express-validator");

router.get('/', isAuth, async (req, res) => {
  try {

    let tags = await getTags(req.user.ID)

    res.send({ tags, message: "Successfully fetched tags" })

  } catch (e) {
    console.log(err)
  }
})

router.get("/color-options", isAuth, async (req, res) => {
  try {
    const GET_DEFAULT_COLORS = `
    SELECT * 
    FROM TBL_DEFAULT_COLOR_OPTION
    WHERE EFF_STATUS = 1
  `

    const defaultOptions = await query(GET_DEFAULT_COLORS)

    const GET_USER_CREATED_COLORS = `
    SELECT * FROM TBL_USER_CREATED_COLOR_OPTION 
    WHERE CREATED_BY_ID = ?
    AND EFF_STATUS = 1
  `

    const userCreatedOptions = await query(GET_USER_CREATED_COLORS, [req.user.ID])

    res.send({ result: {}, defaultOptions, userCreatedOptions, message: "Successfulyl got color options" })
  } catch (err) {
    console.log(err)
  }
})

router.post('/tag-item', isAuth, async (req, res) => {
  const result = await addTaggedItem(
    req.body.tag.ID,
    req.body.item.IS_PAGE ? req.body.item.PAGE_ID : req.body.item.ID,
    req.body.item.IS_PAGE,
    req.user.ID
  )

  res.send({ result, message: 'Tagged item successfully' })
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
      await addTaggedItem(
        justCreatedTag.ID,
        itemFromRequest.IS_PAGE ? itemFromRequest.PAGE_ID : itemFromRequest.ID,
        itemFromRequest.IS_PAGE,
        req.user.ID
      )
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

async function getTags(reqUserId) {
  const sql = `
    SELECT * FROM TBL_TAG
    WHERE EFF_STATUS = 1 
    AND CREATED_BY_ID = ?
    ORDER BY COLOR DESC
  `

  return query(sql, [reqUserId])
}

async function addTaggedItem(tagId, itemId, itemIsPage, userId) {
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

  return query(ADD_TAGGED_ITEM, [
    tagId,
    itemId,
    itemIsPage,
    userId
  ])
}


module.exports = router;