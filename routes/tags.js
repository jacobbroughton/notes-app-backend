const router = require("express").Router();
const passport = require("passport");
const mysql = require('mysql')
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

  } catch (err) {
    console.log(err)
  }
})

router.get("/color-options", isAuth, async (req, res) => {
  try {
    const GET_DEFAULT_COLORS = `
    SELECT *, 
    1 IS_DEFAULT_COLOR
    FROM TBL_DEFAULT_COLOR_OPTION
    WHERE EFF_STATUS = 1
  `

    const defaultOptions = await query(GET_DEFAULT_COLORS)

    const GET_USER_CREATED_COLORS = `
    SELECT *,
    0 IS_DEFAULT_COLOR FROM TBL_USER_CREATED_COLOR_OPTION 
    WHERE CREATED_BY_ID = ?
    AND EFF_STATUS = 1
  `

    const userCreatedOptions = await query(GET_USER_CREATED_COLORS, [req.user.ID])

    res.send({ result: {}, defaultOptions, userCreatedOptions, message: "Successfully got color options" })
  } catch (err) {
    console.log(err)
  }
})

router.post("/color-options/new", isAuth, async (req, res) => {
  try {


    // Check if color exists already
    const CHECK_IF_EXISTS = `
      SELECT * FROM TBL_USER_CREATED_COLOR_OPTION 
      WHERE COLOR_CODE = ? AND CREATED_BY_ID = ?
    `

    // If exists, throw error
    const existingColor = await query(CHECK_IF_EXISTS, [req.body.colorCode, req.user.ID, req.body.colorCode])

    if (existingColor.length > 0) throw 'This color already exists in your custom colors list'

    // Otherwise, add to TBL_USER_CREATED_COLOR_OPTION 
    const ADD_TO_CUSTOM_COLORS = `
      INSERT INTO TBL_USER_CREATED_COLOR_OPTION
      (
        COLOR_CODE,
        EFF_STATUS,
        CREATED_DTTM,
        MODIFIED_DTTM, 
        CREATED_BY_ID,
        MODIFIED_BY_ID
      ) VALUES (
        ?,
        1,
        SYSDATE(),
        null,
        ?,
        null
      )
    `

    const result = await query(ADD_TO_CUSTOM_COLORS, [req.body.colorCode, req.user.ID])

    if (!result) throw 'There was an error'

    const GET_CREATED_COLOR = `
    SELECT *,
    0 IS_DEFAULT_COLOR
    FROM TBL_USER_CREATED_COLOR_OPTION
    WHERE ID = ? AND CREATED_BY_ID = ?
  `

    const [justCreatedColor] = await query(GET_CREATED_COLOR, [result.insertId, req.user.ID])

    if (!justCreatedColor) throw 'Unable to fetch recently created color'

    res.send({ result, justCreatedColor, message: "Successfully added custom color option" })
  } catch (err) {
    console.log(err)
  }
})

router.post("/color-options/delete", isAuth, async (req, res) => {
  try {
    console.log(req.body)
    res.send({ message: "Hello jello" })
    return
    const DISABLE_COLOR = `
    UPDATE TBL_USER_CREATED_COLOR_åOPTION
    SET 
      EFF_STATUS = 0,
      MODIFIED_DTTM = SYSDATE()
    WHERE ID = ? AND CREATED_BY_ID = ?
  `

    const result1 = await query(DISABLE_COLOR, [req.body.colorId, req.user.ID])

    console.log(result1)

    if (!result1) throw 'Failed to delete custom color'

    const UPDATE_ASSOCIATED_TAGS = `
    UPDATE [TBL_TAGGED_ITEM]
    SET 
      EFF_STATUS = 0,
      MODIFIED_DTTM = SYSDATE()
    WHERE COLOR_ID = ? 
    `

    const result2 = await query(UPDATE_ASSOCIATED_TAGS, [req.body.colorId, req.user.ID])


    res.send({ result: result2, justCreatedColor, message: "Successfully deleted custom color option" })
  } catch (err) {
    console.log(err)
  }
})

router.post('/tag-item', isAuth, async (req, res) => {
  try {



    const itemId = req.body.item.IS_PAGE ? req.body.item.PAGE_ID : req.body.item.ID

    const DETERMINE_IF_TAGGED_ALREADY = `
    SELECT * FROM TBL_TAGGED_ITEM
    WHERE ITEM_ID = ?
    AND TAG_ID = ?
  `

    const [existingMatchingTag] = await query(DETERMINE_IF_TAGGED_ALREADY, [itemId, req.body.tag.ID])


    if (req.body.item.IS_PAGE) {

      let result;
      let message = ''

      if (existingMatchingTag) {
        if (existingMatchingTag.EFF_STATUS) {
          const DISABLE_ENABLED_TAGGED_ITEM = `
        UPDATE TBL_TAGGED_ITEM
        SET 
          EFF_STATUS = 0,
          MODIFIED_DTTM = SYSDATE()
        WHERE ID = ?
      `

          result = await query(DISABLE_ENABLED_TAGGED_ITEM, [existingMatchingTag.ID])
          message = 'Tag successfully disabled'

        } else {
          const ENABLE_DISABLED_TAGGED_ITEM = `
        UPDATE TBL_TAGGED_ITEM
        SET EFF_STATUS = 1
        WHERE ID = ?
      `

          result = await query(ENABLE_DISABLED_TAGGED_ITEM, [existingMatchingTag.ID])
          message = 'Tag successfully enabled'
        }
      } else {
        result = await addTaggedItem(
          req.body.tag.ID,
          itemId,
          req.body.item.IS_PAGE,
          req.user.ID
        )
        message = 'Tag successfully added'

      }
    } else {
      const GET_FOLDERS = `
    SELECT 
    *
    FROM TBL_FOLDER
    WHERE EFF_STATUS = 1
    AND CREATED_BY_ID = ?
    `

      let allFoldersByUser = await query(GET_FOLDERS, [req.user.ID])

      let affectedFolderIds = []

      function getChildren(folderIdToCheck) {

        affectedFolderIds.push(folderIdToCheck)

        const children = allFoldersByUser.filter(folder => folder.PARENT_FOLDER_ID === folderIdToCheck).map(folder => folder.ID)

        if (children.length === 0) return

        children.forEach(folderId => getChildren(folderId))
      }

      getChildren(req.body.item.ID)

      const GET_CHILD_PAGES = `
      SELECT * 
      FROM TBL_PAGE 
      WHERE FOLDER_ID IN(?)
      AND EFF_STATUS = 1
      AND CREATED_BY_ID = ?
    `

      let childPages = await query(GET_CHILD_PAGES, [affectedFolderIds, req.user.ID])

      let childPageIds = childPages.map(page => page.PAGE_ID)

      const GET_ASSOCIATED_FOLDER_TAGS = `
      SELECT * FROM TBL_TAGGED_ITEM
      WHERE TAG_ID = ?
      AND IS_PAGE = 0
      AND ITEM_ID IN(?)
    `

      const associatedFolderTags = await query(GET_ASSOCIATED_FOLDER_TAGS, [
        req.body.tag.ID,
        affectedFolderIds
      ])

      const associatedFolderTagIds = associatedFolderTags.map(taggedFolder => taggedFolder.ID)

      let associatedPageTags = []
      let associatedPageTagIds = []

      if (associatedFolderTags.length > 0) {
        const GET_ASSOCIATED_PAGE_TAGS = `
      SELECT * FROM TBL_TAGGED_ITEM
      WHERE TAG_ID = ?
      AND IS_PAGE = 1
      AND CASE ? 
        WHEN 1 THEN ITEM_ID IN(?)
        ELSE 1=1
      END
    `

        associatedPageTags = await query(GET_ASSOCIATED_PAGE_TAGS, [
          req.body.tag.ID,
          childPageIds.length !== 0 ? 1 : 0,
          (childPageIds.length !== 0 ? childPageIds : 'null')
        ])

        associatedPageTagIds = associatedPageTags.map(taggedPage => taggedPage.ID)
      }

      if (existingMatchingTag && associatedFolderTags.length > 0) {

        const UPDATE_EXISTING_TAGGED_FOLDERS = `
        UPDATE TBL_TAGGED_ITEM
        SET 
          EFF_STATUS = (
            CASE 
              WHEN ? = 1 THEN 1
              ELSE 0
            END
          ),
          MODIFIED_DTTM = SYSDATE()
        WHERE ID IN(?)
        AND IS_PAGE = 0
      `

        const result = await query(UPDATE_EXISTING_TAGGED_FOLDERS, [req.body.toggleState, associatedFolderTagIds])

        if (!result) throw 'There was an issue updating existing tagged folders'

        if (associatedPageTags.length > 0) {
          const UPDATE_EXISTING_TAGGED_PAGES = `
          UPDATE TBL_TAGGED_ITEM
          SET 
            EFF_STATUS = (
              CASE 
                WHEN ? = 1 THEN 1
                ELSE 0
              END
            ),
            MODIFIED_DTTM = SYSDATE()
          WHERE ID IN(?)
          AND IS_PAGE = 1
        `

          const result = await query(UPDATE_EXISTING_TAGGED_PAGES, [req.body.toggleState, associatedPageTagIds])

          if (!result) throw 'There was an issue updating existing tagged pages'
        }

      } else {

        console.log('affectedFolderIds', affectedFolderIds)
        console.log('---------------')
        console.log('associatedFolderTags', associatedFolderTagIds)

        const INSERT_NEW_TAGGED_ITEMS = `
        INSERT INTO TBL_TAGGED_ITEM (
          TAG_ID,
          ITEM_ID,
          IS_PAGE,
          EFF_STATUS,
          CREATED_DTTM,
          MODIFIED_DTTM,
          CREATED_BY_ID,
          MODIFIED_BY_ID
        ) VALUES ?
      `

        const SYSDATE = { toSqlString: function () { return 'SYSDATE()'; } }

        const associatedFolderTagTagIds = associatedFolderTags.map(taggedItem => taggedItem.ITEM_ID)
        const associatedPageTagTagIds = associatedPageTags.map(taggedItem => taggedItem.ITEM_ID)

        let newItemsArray = [
          ...affectedFolderIds
            .filter(folderId => !associatedFolderTagTagIds.includes(folderId))
            .map(folderId => [req.body.tag.ID, folderId, 0, 1, SYSDATE, null, req.user.ID, null]),
          ...childPageIds
            .filter(pageId => !associatedPageTagTagIds.includes(pageId))
            .map(pageId => [req.body.tag.ID, pageId, 1, 1, SYSDATE, null, req.user.ID, null])
        ]

        const result = await query(INSERT_NEW_TAGGED_ITEMS, [newItemsArray])

        if (!result) throw 'There was an issue adding new tagged items'

      }
    }
    res.send({ result: {}, message: 'hopefully successful idk' })
  } catch (error) {

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

    let GET_TAG_COLOR = ``
    let sqlParams = []

    if (req.body.color.IS_DEFAULT_COLOR) {
      sqlParams.push(req.body.color.ID)
      GET_TAG_COLOR = `
        SELECT * FROM TBL_DEFAULT_COLOR_OPTION
        WHERE ID = ?
        LIMIT 1;
      `
    } else {
      sqlParams.push(req.body.color.ID, req.user.ID)
      GET_TAG_COLOR = `
        SELECT * FROM TBL_USER_CREATED_COLOR_OPTION 
        WHERE ID = ?
        AND CREATED_BY_ID = ?
        LIMIT 1;
      `
    }

    const [tagColor] = await query(GET_TAG_COLOR, sqlParams)

    if (!tagColor) throw 'Tag color not found'

    const CREATE_TAG = `
      INSERT INTO TBL_TAG (
        NAME,
        COLOR_ID,
        HAS_DEFAULT_COLOR,
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
        null,
        ?,
        null
      )
    `

    let result = await query(CREATE_TAG, [req.body.name, tagColor.ID, req.body.color.IS_DEFAULT_COLOR, req.user.ID])

    if (!result) throw 'There was an error creating the tag'

    const [justCreatedTag] = await getSingleTag(req.user.ID, result.insertId)

    if (!justCreatedTag) throw 'There was a problem getting revcently created tag'

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

    const UPDATE_TAG = `
      UPDATE TBL_TAG 
      SET
        NAME = ?,
        COLOR_ID = ?,
        HAS_DEFAULT_COLOR = ?
      WHERE ID = ?
    `

    const result = await query(UPDATE_TAG, [req.body.name, req.body.color.ID, req.body.color.IS_DEFAULT_COLOR, req.body.id])

    if (!result) throw 'There was an issue updating this tag'

    const [justUpdatedTag] = await getSingleTag(req.user.ID, req.body.id)

    if (!justUpdatedTag) throw 'There was an issue getting the tag that was just updated'

    res.send({ result, justUpdatedTag, message: "Tag successfully edited" })

  } catch (err) {
    console.log(err)
  }


})

router.post('/delete', isAuth, async (req, res) => {
  try {
    const DELETE_TAG = `
      UPDATE TBL_TAG 
      SET
        EFF_STATUS = 0,
        MODIFIED_DTTM = SYSDATE()
      WHERE ID = ?
      AND CREATED_BY_ID = ?
    `

    const result1 = await query(DELETE_TAG, [req.body.id, req.user.ID])

    if (!result1) throw 'There was an error deleting tag'

    const UPDATE_TAGGED_ITEMS = `
      UPDATE TBL_TAGGED_ITEM
      SET 
        EFF_STATUS = 0,
        MODIFIED_DTTM = SYSDATE()
      WHERE TAG_ID = ?
      AND CREATED_BY_ID = ?
    `

    const result2 = await query(UPDATE_TAGGED_ITEMS, [req.body.id, req.user.ID])


    res.send({ result: result2, message: "Tag successfully deleted" })
  } catch (err) {
    console.log(err)
  }

})

async function getTags(reqUserId) {
  const sql = `
    SELECT a.*, 
    CASE
      WHEN b.COLOR_CODE IS NOT NULL THEN b.COLOR_CODE
      WHEN c.COLOR_CODE IS NOT NULL THEN c.COLOR_CODE
      ELSE '#000000'
    END AS COLOR_CODE
    FROM TBL_TAG a
    LEFT JOIN TBL_DEFAULT_COLOR_OPTION b
    ON a.COLOR_ID = b.ID
    AND b.EFF_STATUS = 1
    LEFT JOIN TBL_USER_CREATED_COLOR_OPTION c
    ON a.COLOR_ID = c.ID
    AND c.CREATED_BY_ID = ?
    AND c.EFF_STATUS = 1
    WHERE a.EFF_STATUS = 1 
    AND a.CREATED_BY_ID = ?
  `

  return query(sql, [reqUserId, reqUserId, reqUserId])
}

async function getSingleTag(reqUserId, tagId) {
  const sql = `
    SELECT a.*,
    CASE 
      WHEN a.HAS_DEFAULT_COLOR = 1 THEN b.COLOR_CODE
      ELSE c.COLOR_CODE
    END COLOR_CODE
    FROM TBL_TAG a
    LEFT JOIN TBL_DEFAULT_COLOR_OPTION b
    ON a.COLOR_ID = b.ID
    AND b.EFF_STATUS = 1
    LEFT JOIN TBL_USER_CREATED_COLOR_OPTION c
    ON a.COLOR_ID = c.ID
    AND c.EFF_STATUS = 1
    AND c.CREATED_BY_ID = ?
    WHERE a.EFF_STATUS = 1 
    AND a.CREATED_BY_ID = ?
    AND a.ID = ?
    LIMIT 1
  `

  return query(sql, [reqUserId, reqUserId, tagId])
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