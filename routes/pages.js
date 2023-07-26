const router = require("express").Router();
const pool = require("../config/database").pool;
const isAuth = require("../authMiddleware").isAuth;
const util = require("util");
const query = util.promisify(pool.query).bind(pool);

router.get("/", isAuth, async (req, res) => {
  try {
    const GET_PAGES = `
      SELECT 
        a.*, 
        GROUP_CONCAT(b.TAG_ID ORDER BY b.TAG_ID ASC SEPARATOR ',') TAGS 
      FROM TBL_PAGE a
      LEFT JOIN TBL_TAGGED_ITEM b
        ON a.PAGE_ID = b.ITEM_ID
        AND b.IS_PAGE = 1
        AND b.EFF_STATUS = 1
        AND b.CREATED_BY_ID = ?
      LEFT JOIN TBL_TAG c
        ON b.TAG_ID = c.ID 
        AND c.EFF_STATUS = 1
      WHERE a.EFF_STATUS = 1
      AND a.CREATED_BY_ID = ?
      GROUP BY a.PAGE_ID
      `;

    const pages = await query(GET_PAGES, [req.user.ID, req.user.ID]);

    pages.forEach(
      (page) =>
        (page.TAGS = page.TAGS
          ? page.TAGS.split(",").map((tagId) => parseInt(tagId))
          : [])
    );

    res.send({ pages, message: "Successfully got pages" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/new", isAuth, async (req, res) => {
  try {
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

    const result = await query(sql, [
      req.body.parentFolderId,
      req.body.newPageName,
      req.body.newPageName,
      req.body.newPageBody ||
        '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}',
      req.user.ID,
    ]);

    res.send({
      result,
      requestBody: req.body,
      message: "Successfully added a new page",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/edit", isAuth, async (req, res) => {
  try {
    if (!req.body.name) {
      res.statusText = "Name cannot be empty";
      res.status(409).end();
      return
    }

    const UPDATE_PAGE = `
      UPDATE TBL_PAGE
      SET 
      NAME = ?,
      BODY = ?,
      MODIFIED_DTTM = SYSDATE()
      WHERE PAGE_ID = ?
    `;

    const result = await query(UPDATE_PAGE, [
      req.body.name.replace(/'/g, "''"),
      req.body.body?.replace(/'/g, "''"),
      req.body.pageId,
    ]);

    if (!result) {
      res.statusText = "There was an error editing the page";
      res.status(409).end();
      return
    }

    const SELECT_UPDATED_PAGE = `
        SELECT * 
        FROM TBL_PAGE
        WHERE PAGE_ID = ?
        AND EFF_STATUS = 1
      `;

    const rows = await query(SELECT_UPDATED_PAGE, [req.body.pageId]);
    res.send({ modifiedPage: rows[0], message: "Successfully edited page" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/updateParentFolder", isAuth, async (req, res) => {
  try {
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

    const result = await query(sql);

    res.send({ result, message: "Successfully updated parent folder id" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete", isAuth, async (req, res) => {
  try {
    const sql = `
    UPDATE TBL_PAGE
    SET 
      EFF_STATUS = 0,
      MODIFIED_DTTM = SYSDATE()
    WHERE PAGE_ID = ?
  `;

    const result = await query(sql, [req.body.pageId]);

    res.send({ result, message: "Successfully deleted page" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete-multiple", isAuth, async (req, res) => {
  try {
    const pageIdsForDelete = req.body.pages.map((page) => page.PAGE_ID);

    const sql = `
      UPDATE TBL_PAGE
      SET 
        EFF_STATUS = 0,
        MODIFIED_DTTM = SYSDATE()
      WHERE PAGE_ID IN (?)
    `;

    const result = query(sql, [[...pageIdsForDelete]]);

    res.send({
      result,
      deletedPageIds: pageIdsForDelete,
      message: "Successfully deleted multiple pages",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/rename", isAuth, async (req, res) => {
  try {
    const sql = `
      UPDATE TBL_PAGE
      SET NAME = ?
      WHERE PAGE_ID = ?
      `;

    const result = await query(sql, [req.body.newName, req.body.pageId]);
    res.send({ result, message: "Successfully renamed page" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/favorite", isAuth, async (req, res) => {
  try {
    const sql = `
      UPDATE TBL_PAGE
      SET IS_FAVORITE = (
        CASE 
          WHEN ? = 1 THEN 1
          ELSE 0
        END
      )
      WHERE PAGE_ID = ?
    `;

    const result = await query(sql, [req.body.favoriteStatus, req.body.pageId]);
    res.send({ result, message: "Successfully favorited page" });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
