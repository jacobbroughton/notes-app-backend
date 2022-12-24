const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
const connection = require("../config/database").connection;
const isAuth = require("./authMiddleware").isAuth;
const isAdmin = require("./authMiddleware").isAdmin;
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
const { body } = require("express-validator");

router.get("/", isAuth, (req, res) => {
  const sql = `
  SELECT * FROM TBL_FOLDER
  WHERE EFF_STATUS = 1
  AND CREATED_BY_ID = ?
  `;

  query(sql, [req.user.ID], (err, rows) => {
    if (err) throw err;

    let folders = [];
    let tier = 1;

    const rootFolders = rows
      .filter((folder) => folder.PARENT_FOLDER_ID === null)
      .map((folder) => {
        return {
          ...folder,
          TIER: tier,
        };
      })
      .sort((a, b) => b.CREATED_DTTM - a.CREATED_DTTM);
    folders.push(...rootFolders);

    function determineChildren(parentFolder, allFolders, tier) {
      let children = allFolders
        .filter((folder) => folder.PARENT_FOLDER_ID === parentFolder.ID)
        .map((folder) => {
          return {
            ...folder,
            TIER: tier,
          };
        })
        .sort((a, b) => b.CREATED_DTTM - a.CREATED_DTTM);

      if (children.length === 0) return;

      let indexToAddChildren;

      folders.forEach((folder, index) => {
        if (folder.ID === parentFolder.ID) indexToAddChildren = index;
        // if ()  folder.TIER = tier
      });

      folders.splice(indexToAddChildren, 0, ...children);

      children.forEach((folder) => determineChildren(folder, allFolders, tier + 1));
    }

    rootFolders.forEach((folder) => determineChildren(folder, rows, 2));

    folders.forEach((folder, index) => {
      folder.ORDER = index + 1;
    });

    folders = folders.sort((a, b) => b.ORDER - a.ORDER);

    res.send({ folders: folders });
  });
});

router.post("/new", isAuth, (req, res, next) => {
  const sql = `
  INSERT INTO TBL_FOLDER (
    PARENT_FOLDER_ID,
    NAME,
    EFF_STATUS,
    CREATED_DTTM,
    MODIFIED_DTTM,
    CREATED_BY_ID,
    MODIFIED_BY_ID
  ) VALUES (
    ?,
    ?,
    true,
    SYSDATE(),
    null,
    ?,
    null
  )
`;

  query(
    sql,
    [
      req.body.parentFolderId,
      req.body.newFolderName,
      req.user.ID,
    ],
    (err, result) => {
      if (err) throw err;
      res.send({ message: "Successfully added folder" });
    }
  );
});


router.post("/delete", isAuth, async (req, res, next) => {
  async function getChildren(folderId) {
    return await query(`
    SELECT ID FROM TBL_FOLDER
    WHERE PARENT_FOLDER_ID = ?
    AND EFF_STATUS = 1
  `, [folderId]);
  }

  async function getPagesInFolder(folderId) {
    return await query(`
    SELECT PAGE_ID FROM TBL_PAGE
    WHERE FOLDER_ID = ?
    AND EFF_STATUS = 1
  `, [folderId]);
  }

  // async function deletefolders(folderId) {
  //   return await query(`
  //   SELECT PAGE_ID FROM TBL_PAGE
  //   WHERE FOLDER_ID = ?
  //   AND EFF_STATUS = 1
  // `, [folderId]);
  // }

  async function deleteFolders(folderIds) {
    return await query(`
    UPDATE TBL_FOLDER
    SET EFF_STATUS = 0
    WHERE ID IN (?)
  `, [...folderIds]);
  }

  async function deletePages(pageIds) {
    return await query(`
    UPDATE TBL_PAGE
    SET EFF_STATUS = 0
    WHERE PAGE_ID IN (?)
  `, [...pageIds]);
  }

  let foldersToDelete = [];
  let pagesToDelete = [];

  foldersToDelete.push(req.body.folderId);

  async function getNestedRows(folderId) {
    const children = await getChildren(folderId);
    const pages = await getPagesInFolder(folderId);

    for (let i = 0; i < pages.length; i++) {
      pagesToDelete.push(pages[i].PAGE_ID);
    }

    for (let i = 0; i < children.length; i++) {
      foldersToDelete.push(children[i].ID);
      await getNestedRows(children[i].ID);
    }
  }

  await getNestedRows(req.body.folderId);
  if (pagesToDelete.length > 0) await deletePages(pagesToDelete);
  await deleteFolders(foldersToDelete);

  res.send({
    deletedFolders: foldersToDelete,
    deletedPages: pagesToDelete,
    message: "Folders and pages successfully deleted",
  });
  // for (let i = 0; i < foldersToDelete.length; i++) {
  //   deletePages
  // }
});

router.post("/delete-multiple", isAuth, (req, res) => {

  const folderIdsForDelete = req.body.folders.map(folder => folder.ID)

  const sql = `
    UPDATE TBL_FOLDER
    SET EFF_STATUS = 0
    WHERE ID IN (?)
  `

  connection.query(sql, [[...folderIdsForDelete]], (err, result) => {
    if (err) throw err;
    res.send({ result, deletedFolderIds: folderIdsForDelete, message: "Successfully deleted multiple folders" })
  })
})

router.post("/rename", isAuth, (req, res) => {
  const sql = `
  UPDATE TBL_FOLDER
  SET NAME = ?
  WHERE ID = ?
  `
  connection.query(sql, [req.body.newName, req.body.folderId], (err, result) => {
    if (err) throw err;
    res.send({ result, message: "Successfully renamed folder" })
  });
});

module.exports = router;
