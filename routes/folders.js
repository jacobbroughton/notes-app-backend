import express from "express";
import passport from "passport";
import { genPassword } from "../lib/passwordUtils.js";
import { pool } from "../config/database.js";
import { isAuth, isAdmin } from "../authMiddleware.js";
import util from "util";

const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  try {
    const SELECT_FOLDERS = `
    select 
    a.*, 
    string_agg(b.tag_id::text, ',' order by b.tag_id ASC) AS tags
    from folders a
    left join tagged_items b
      on a.id = b.item_id
      and b.is_page = 0
      and b.eff_status = 1
      and b.created_by_id = $1
    left join tags c
      on b.tag_id = c.id 
      and c.eff_status = 1
    where a.eff_status = 1
    and a.created_by_id = $1
    GROUP BY a.id
    `;

    let result = await pool.query(SELECT_FOLDERS, [req.user.id]);

    let folders = [];
    let tier = 1;

    const rootFolders = result.rows
      .filter((folder) => folder.parent_folder_id === null)
      .map((folder) => {
        return {
          ...folder,
          TIER: tier,
        };
      })
      .sort((a, b) => b.created_dttm - a.created_dttm);
    folders.push(...rootFolders);

    function determineChildren(parentFolder, allFolders, tier) {
      let children = allFolders
        .filter((folder) => folder.parent_folder_id === parentFolder.id)
        .map((folder) => {
          return {
            ...folder,
            TIER: tier,
          };
        })
        .sort((a, b) => b.created_dttm - a.created_dttm);

      if (children.length === 0) return;

      let indexToAddChildren;

      folders.forEach((folder, index) => {
        if (folder.id === parentFolder.id) indexToAddChildren = index;
      });

      folders.splice(indexToAddChildren, 0, ...children);

      children.forEach((folder) => determineChildren(folder, allFolders, tier + 1));
    }

    rootFolders.forEach((folder) => determineChildren(folder, folders, 2));

    folders.forEach((folder, index) => {
      folder.TAGS = folder.TAGS
        ? folder.TAGS.split(",").map((tagId) => parseInt(tagId))
        : [];
      folder.ORDER = index + 1;
    });

    folders = folders.sort((a, b) => b.ORDER - a.ORDER);

    res.send({ folders: folders });
  } catch (error) {
    console.log(error);
  }
});

router.post("/new", isAuth, async (req, res, next) => {
  try {
    const sql = `
    insert into folders (
      parent_folder_id,
      name,
      eff_status,
      created_dttm,
      modified_dttm,
      created_by_id,
      modified_by_id
    ) values (
      $1,
      $2,
      1,
      now(),
      null,
      $3,
      null
    )
  `;

    const result = await pool.query(sql, [
      req.body.parentFolderId,
      req.body.newFolderName,
      req.user.id,
    ]);

    if (!result) {
      res.statusMessage = "There was an error adding the new folder";
      res.status(400).end();
      return;
    }

    res.send({ result, message: "Successfully added folder" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/delete", isAuth, async (req, res, next) => {
  try {
    async function getChildren(folderId) {
      return await pool.query(
        `
      select id from folders
      where parent_folder_id = $1
      and eff_status = 1
    `,
        [folderId]
      );
    }

    async function getPagesInFolder(folderId) {
      return await pool.query(
        `
      select page_id from pages
      where folder_id = $1
      and eff_status = 1
    `,
        [folderId]
      );
    }

    async function deleteFolders(folderIds) {
      return await pool.query(
        `
      update folders
      set 
        eff_status = 0,
        modified_dttm = now()
      where id IN ($1)
    `,
        [...folderIds]
      );
    }

    async function deletePages(pageIds) {
      return await pool.query(
        `
      update pages
      set 
        eff_status = 0,
        modified_dttm = now()
      where page_id IN ($1)
    `,
        [...pageIds]
      );
    }

    let foldersToDelete = [];
    let pagesToDelete = [];

    foldersToDelete.push(req.body.folderId);

    async function getNestedRows(folderId) {
      const children = await getChildren(folderId);
      const pages = await getPagesInFolder(folderId);

      for (let i = 0; i < pages.length; i++) {
        pagesToDelete.push(pages[i].page_id);
      }

      for (let i = 0; i < children.length; i++) {
        foldersToDelete.push(children[i].id);
        await getNestedRows(children[i].id);
      }
    }

    await getNestedRows(req.body.folderId);

    if (pagesToDelete.length > 0) await deletePages(pagesToDelete);

    const result = await deleteFolders(foldersToDelete);

    console.log(result);

    res.send({
      deletedFolders: foldersToDelete,
      deletedPages: pagesToDelete,
      message: "Folders and pages successfully deleted",
    });
  } catch (error) {
    console.error(error);
  }
});

router.post("/delete-multiple", isAuth, async (req, res) => {
  try {
    const folderIdsForDelete = req.body.folders.map((folder) => folder.id);

    console.log(folderIdsForDelete);

    const sql = `
      update folders
    set 
      eff_status = 0,
      modified_dttm = now()
    where id = any($1::int[])
    `;

    const result = await pool.query(sql, [[folderIdsForDelete]]);

    if (!result) {
      res.statusText = "There was an error deleting multiple folders";
      res.status(409).end();
      return;
    }

    res.send({
      result,
      deletedFolderIds: folderIdsForDelete,
      message: "Successfully deleted multiple folders",
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/rename", isAuth, async (req, res) => {
  try {
    const sql = `
    update folders
    set name = $1
    where id = $2
    `;
    const result = await pool.query(sql, [req.body.newName, req.body.folderId]);

    if (!result) {
      res.statusText = "There was an error renaming this folder";
      res.status(409).end();
      return;
    }

    res.send({ result, message: "Successfully renamed folder" });
  } catch (error) {
    console.log(error);
  }
});

export default router;
