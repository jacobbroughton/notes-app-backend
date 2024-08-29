import express from "express";
import { pool } from "../config/database.js";
import { isAuth } from "../authMiddleware.js";

const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  try {
    const GET_PAGES = `
      select 
        a.*,
        c.id tag_id,
        c.name tag_name,
        d.color_code tag_color_code
      from pages a
      left join tagged_items b
        on a.page_id = b.item_id
        and b.is_page = 1
        and b.eff_status = 1
        and b.created_by_id = $1
      left join tags c
      on b.tag_id = c.id
      left join default_color_options d
      on c.color_id = d.id
      where a.eff_status = 1
      and a.created_by_id = $2
      group by a.page_id,
      c.id,
      c.name,
      d.color_code
      `;

    const result = await pool.query(GET_PAGES, [req.user.id, req.user.id]);

    res.send(result.rows);
  } catch (err) {
    console.log(err);
  }
});

router.post("/new", isAuth, async (req, res) => {
  try {
    const sql = `
    insert into pages (
      folder_id,
      name,
      TITLE,
      body,
      eff_status,
      created_dttm,
      modified_dttm,
      created_by_id,
      modified_by_id
    ) values (
      $1,
      $2,
      $3,
      $4,
      1,
      now(),
      null,
      $5,
      null
    )
    `;

    const result = await pool.query(sql, [
      req.body.parentFolderId,
      req.body.newPageName,
      req.body.newPageName,
      req.body.newPageBody || "",
      req.user.id,
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
      return;
    }

    const UPDATE_PAGE = `
      update pages
      set 
      name = $1,
      body = $2,
      modified_dttm = now()
      where page_id = $3
    `;

    const result = await pool.query(UPDATE_PAGE, [
      req.body.name.replace(/'/g, "''"),
      req.body.body?.replace(/'/g, "''"),
      req.body.pageId,
    ]);

    if (!result) {
      res.statusText = "There was an error editing the page";
      res.status(409).end();
      return;
    }

    const SELECT_UPDATED_PAGE = `
        select * 
        from pages
        where page_id = $1
        and eff_status = 1
      `;

    const result2 = await pool.query(SELECT_UPDATED_PAGE, [req.body.pageId]);
    res.send({ modifiedPage: result2.rows[0], message: "Successfully edited page" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/updateParentFolder", isAuth, async (req, res) => {
  try {
    let newFolderId;

    if (req.body.droppedOntoItem.tier === 0) {
      newFolderId = null;
    } else {
      newFolderId = req.body.droppedOntoItem?.id
        ? req.body.droppedOntoItem?.id
        : req.body.droppedOntoItem?.folder_id;
    }

    const sql = `
      update pages
      set folder_id = ${newFolderId}
      where page_id = ${req.body.affectedPage?.page_id}
    `;

    const result = await pool.query(sql);

    res.send({ result, message: "Successfully updated parent folder id" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete", isAuth, async (req, res) => {
  try {
    const sql = `
    update pages
    set 
      eff_status = 0,
      modified_dttm = now()
    where page_id = $1
  `;

    const result = await pool.query(sql, [req.body.pageId]);

    res.send({ result, message: "Successfully deleted page" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete-multiple", isAuth, async (req, res) => {
  try {
    const pageIdsForDelete = req.body.pages.map((page) => page.page_id);

    const sql = `
      update pages
      set 
        eff_status = 0,
        modified_dttm = now()
      where page_id = any ($1::int[])
    `;

    const result = await pool.query(sql, [[...pageIdsForDelete]]);

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
      update pages
      set name = $1
      where page_id = $2
      `;

    const result = await pool.query(sql, [req.body.newName, req.body.pageId]);
    res.send({ result, message: "Successfully renamed page" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/favorite", isAuth, async (req, res) => {
  try {
    const sql = `
      update pages
      set IS_FAVORITE = (
        case 
          when $1 = 1 then 1
          else 0
        end
      )
      where page_id = $2
    `;

    const result = await pool.query(sql, [req.body.favoriteStatus, req.body.pageId]);
    res.send({ result, message: "Successfully favorited page" });
  } catch (err) {
    console.log(err);
  }
});

export default router;
