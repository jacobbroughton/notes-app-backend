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
    c.id tag_id,
    c.name tag_name,
    d.color_code tag_color_code
    from folders a
    left join tagged_items b
      on a.id = b.item_id
      and b.is_page = 0
      and b.eff_status = 1
      and b.created_by_id = $1
    left join tags c
      on b.tag_id = c.id 
    left join default_color_options d
      on c.color_id = d.id
      and c.eff_status = 1
    where a.eff_status = 1
    and a.created_by_id = $1
    group by a.id,
    a.eff_status,
    a.parent_folder_id,
    a.created_dttm,
    a.created_by_id,
    a.modified_dttm,
    a.modified_by_id,
    c.id,
    a.name,
    c.name,
    d.color_code
    `;

    let { rows: allFolders } = await pool.query(SELECT_FOLDERS, [req.user.id]);

    let folders = [];
    let tier = 1;

    const rootFolders = allFolders
      .filter((folder) => folder.parent_folder_id === null)
      .map((folder) => {
        return {
          ...folder,
          tier: tier,
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
            tier: tier,
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

    rootFolders.forEach((folder) => determineChildren(folder, allFolders, 2));

    folders.forEach((folder, index) => {
      folder.order = index + 1;
    });

    folders = folders.sort((a, b) => {
      return b.order - a.order;
    });

    res.send(folders);
  } catch (err) {
    console.log('/folders/', err);
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

    if (!result) throw "There was an error adding the new folder"

    res.send({ result, message: "Successfully added folder" });
  } catch (err) {
    console.log('/folders/new', err);
  }
});

router.post("/delete", isAuth, async (req, res, next) => {
  try {
    let foldersToDelete = [];
    let pagesToDelete = [];

    foldersToDelete.push(req.body.folderId);


    async function getNestedRows(folderId) {
      const {rows: childFolders} = await pool.query(
        `
          select id from folders
          where parent_folder_id = $1
          and eff_status = 1
        `,
        [folderId]
      );

      const {rows: pages} = await pool.query(
        `
        select page_id from pages
        where folder_id = $1
        and eff_status = 1
      `,
        [folderId]
      );

      for (let i = 0; i < pages.length; i++) {
        pagesToDelete.push(pages[i].page_id);
      }

      for (let i = 0; i < childFolders.length; i++) {
        foldersToDelete.push(childFolders[i].id);
        await getNestedRows(childFolders[i].id);
      }

    }

    await getNestedRows(req.body.folderId);

    if (pagesToDelete.length > 0)
      await pool.query(
        `
        update pages
        set 
          eff_status = 0,
          modified_dttm = now()
        where page_id = any($1::int[])
      `,
        [pagesToDelete]
      );

    const result = await pool.query(
      `
        update folders
        set 
          eff_status = 0,
          modified_dttm = now()
        where id = any ($1::int[])
      `,
      [foldersToDelete]
    );

    res.send({
      deletedFolders: foldersToDelete,
      deletedPages: pagesToDelete,
      message: "Folders and pages successfully deleted",
    });
  } catch (err) {
    console.error('/folders/delete', err);
  }
});

router.post("/delete-multiple", isAuth, async (req, res) => {
  try {
    const folderIdsForDelete = req.body.folders.map((folder) => folder.id);

    const sql = `
      update folders
    set 
      eff_status = 0,
      modified_dttm = now()
    where id = any($1::int[])
    `;

    const result = await pool.query(sql, [[folderIdsForDelete]]);

    if (!result) throw "There was an error deleting multiple folders";

    res.send({
      result,
      deletedFolderIds: folderIdsForDelete,
      message: "Successfully deleted multiple folders",
    });
  } catch (err) {
    console.log('/folders/delete-multiple', err);
    res.statusText = error.toString();
    res.status(409).end();
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

    if (!result) throw "There was an error renaming this folder";

    res.send({ result, message: "Successfully renamed folder" });
  } catch (err) {
    console.log('/folders/rename', err);
    res.statusText = err.toString();
    res.status(409).end();
  }
});

export default router;
