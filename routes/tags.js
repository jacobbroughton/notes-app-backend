// const router = require("express").Router();
// const pool = require("../config/database.js").pool;
// const isAuth = require("../authMiddleware.js").isAuth;
// const util = require("util");
// const query = util.promisify(pool.query).bind(pool);
// const { body } = require("express-validator");

import express from "express";
import { pool } from "../config/database.js";
import { isAuth } from "../authMiddleware.js";
import util from "util";
import { body } from "express-validator";

const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  try {
    let tags = await getTags(req.user.id);

    res.send({ tags, message: "Successfully fetched tags" });
  } catch (err) {
    console.log(err);
  }
});

router.get("/color-options", isAuth, async (req, res) => {
  try {
    const GET_DEFAULT_COLORS = `
    select *, 
    1 is_default_color
    from default_color_options
    where eff_status = 1
  `;

    const defaultOptions = await pool.query(GET_DEFAULT_COLORS);

    if (!defaultOptions) {
      res.statusText = "Failed to fetch default color options";
      res.status(409).end();
      return;
    }

    const GET_USER_CREATED_COLORS = `
    select *,
    0 is_default_color from user_created_color_options 
    where created_by_id = $1
    and eff_status = 1
  `;

    const userCreatedOptions = await pool.query(GET_USER_CREATED_COLORS, [req.user.id]);

    if (!userCreatedOptions) {
      res.statusText = "Failed to fetch user created color options";
      res.status(409).end();
      return;
    }

    res.send({
      result: {},
      defaultOptions,
      userCreatedOptions,
      message: "Successfully got color options",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/color-options/new", isAuth, async (req, res) => {
  try {
    // Check if color exists already
    const CHECK_IF_EXISTS = `
      select * from user_created_color_options 
      where color_code = $1 and created_by_id = $2
    `;

    // If exists, throw error
    const existingColor = await pool.query(CHECK_IF_EXISTS, [
      req.body.colorCode,
      req.user.id,
    ]);

    if (existingColor.length > 0) {
      if (!defaultOptions) {
        res.statusText = "This color already exists in your custom colors list";
        res.status(409).end();
        return;
      }
    }

    // Otherwise, add to user_created_color_options
    const ADD_TO_CUSTOM_COLORS = `
      insert into user_created_color_options
      (
        color_code,
        eff_status,
        created_dttm,
        modified_dttm, 
        created_by_id,
        modified_by_id
      ) values (
        $1,
        1,
        now(),
        null,
        $2,
        null
      )
    `;

    const result = await pool.query(ADD_TO_CUSTOM_COLORS, [
      req.body.colorCode,
      req.user.id,
    ]);

    if (!result) {
      res.statusText = "There was an error adding to your custom colors";
      res.status(409).end();
      return;
    }

    const GET_CREATED_COLOR = `
    select *,
    0 is_default_color
    from user_created_color_options
    where id = $1 and created_by_id = $2
  `;

    const [justCreatedColor] = await pool.query(GET_CREATED_COLOR, [
      result.insertId,
      req.user.id,
    ]);

    if (!justCreatedColor) {
      res.statusText = "Unable to fetch recently created color";
      res.status(409).end();
      return;
    }

    res.send({
      result,
      justCreatedColor,
      message: "Successfully added custom color option",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/color-options/delete", isAuth, async (req, res) => {
  try {
    const DISABLE_COLOR = `
    update user_created_color_options
    set 
      eff_status = 0,
      modified_dttm = now()
    where id = $1 and created_by_id = $2
  `;

    const result1 = await pool.query(DISABLE_COLOR, [req.body.colorId, req.user.id]);

    console.log(result1);

    if (!result1) {
      res.statusText = "Failed to delete custom color";
      res.status(409).end();
      return;
    }

    const UPDATE_ASSOCIATED_TAGS = `
    update [tagged_items]
    set 
      eff_status = 0,
      modified_dttm = now()
    where color_id = $1
    `;

    const result2 = await pool.query(UPDATE_ASSOCIATED_TAGS, [req.body.colorId]);

    res.send({
      result: result2,
      justCreatedColor,
      message: "Successfully deleted custom color option",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/tag-item", isAuth, async (req, res) => {
  try {
    const itemId = req.body.item.is_page ? req.body.item.page_id : req.body.item.id;

    const DETERMINE_IF_TAGGED_ALREADY = `
    select * from tagged_items
    where item_id = $1
    and tag_id = $2
  `;

    const [existingMatchingTag] = await pool.query(DETERMINE_IF_TAGGED_ALREADY, [
      itemId,
      req.body.tag.id,
    ]);

    if (req.body.item.is_page) {
      let result;
      let message = "";

      if (existingMatchingTag) {
        if (existingMatchingTag.eff_status) {
          const DISABLE_ENABLED_TAGGED_ITEM = `
            update tagged_items
            set 
              eff_status = 0,
              modified_dttm = now()
            where id = $1
          `;

          result = await pool.query(DISABLE_ENABLED_TAGGED_ITEM, [
            existingMatchingTag.id,
          ]);
          message = "Tag successfully disabled";
        } else {
          const ENABLE_DISABLED_TAGGED_ITEM = `
            update tagged_items
            set eff_status = 1
            where id = $1
          `;

          result = await pool.query(ENABLE_DISABLED_TAGGED_ITEM, [
            existingMatchingTag.id,
          ]);
          message = "Tag successfully enabled";
        }
      } else {
        result = await addTaggedItem(
          req.body.tag.id,
          itemId,
          req.body.item.is_page,
          req.user.id
        );
        message = "Tag successfully added";
      }

      res.send({ result, message: "Successfully updated existing tagged page" });
    } else {
      const GET_FOLDERS = `
        select 
        *
        from folders
        where eff_status = 1
        and created_by_id = $1
        `;

      let allFoldersByUser = await pool.query(GET_FOLDERS, [req.user.id]);

      let affectedFolderIds = [];

      function getChildren(folderIdToCheck) {
        affectedFolderIds.push(folderIdToCheck);

        const children = allFoldersByUser
          .filter((folder) => folder.parent_folder_id === folderIdToCheck)
          .map((folder) => folder.id);

        if (children.length === 0) return;

        children.forEach((folderId) => getChildren(folderId));
      }

      getChildren(req.body.item.id);

      const GET_CHILD_PAGES = `
        select * 
        from pages 
        where folder_id in($1)
        and eff_status = 1
        and created_by_id = $2
      `;

      let childPages = await pool.query(GET_CHILD_PAGES, [
        affectedFolderIds,
        req.user.id,
      ]);

      let childPageIds = childPages.map((page) => page.page_id);

      const GET_ASSOCIATED_FOLDER_TAGS = `
      select * from tagged_items
      where tag_id = $1
      and is_page = 0
      and item_id in($2)
    `;

      const associatedFolderTags = await pool.query(GET_ASSOCIATED_FOLDER_TAGS, [
        req.body.tag.id,
        affectedFolderIds,
      ]);

      const associatedFolderTagIds = associatedFolderTags.map(
        (taggedFolder) => taggedFolder.id
      );

      let associatedPageTags = [];
      let associatedPageTagIds = [];

      console.log("childPageIds", childPageIds);

      if (childPageIds.length > 0) {
        const GET_ASSOCIATED_PAGE_TAGS = `
          select * from tagged_items
          where tag_id = $1
          and is_page = 1
          and case
            when $2=1 then item_id in($3)
            else 1=1
          end
        `;

        associatedPageTags = await pool.query(GET_ASSOCIATED_PAGE_TAGS, [
          req.body.tag.id,
          childPageIds.length !== 0 ? 1 : 0,
          childPageIds.length !== 0 ? childPageIds : "null",
        ]);

        console.log("associatedPageTags1", associatedPageTags);

        associatedPageTagIds = associatedPageTags.map((taggedPage) => taggedPage.id);
      }

      if (existingMatchingTag && associatedFolderTags.length > 0) {
        const UPDATE_EXISTING_TAGGED_FOLDERS = `
          update tagged_items
          set 
            eff_status = (
              case 
                when $1 = 1 then 1
                else 0
              end
            ),
            modified_dttm = now()
          where id in($2)
          and is_page = 0
        `;

        let result = await pool.query(UPDATE_EXISTING_TAGGED_FOLDERS, [
          req.body.toggleState,
          associatedFolderTagIds,
        ]);

        if (!result) {
          res.statusText = "There was an issue updating existing tagged folders";
          res.status(409).end();
          return;
        }

        if (associatedPageTags.length > 0) {
          const UPDATE_EXISTING_TAGGED_PAGES = `
            update tagged_items
            set 
              eff_status = (
                case 
                  when $1 = 1 then 1
                  else 0
                end
              ),
              modified_dttm = now()
            where id in($2)
            and is_page = 1
          `;

          result = await pool.query(UPDATE_EXISTING_TAGGED_PAGES, [
            req.body.toggleState,
            associatedPageTagIds,
          ]);

          if (!result) {
            res.statusText = "There was an issue updating existing tagged pages";
            res.status(409).end();
            return;
          }
        }

        res.send({ result, message: "Successfully updated existing tagged items" });
      } else {
        console.log("associatedPageTags", associatedPageTags);

        const INSERT_NEW_TAGGED_ITEMS = `
          insert into tagged_items (
            tag_id,
            item_id,
            is_page,
            eff_status,
            created_dttm,
            modified_dttm,
            created_by_id,
            modified_by_id
          ) values $1
        `;

        const SYSDATE = {
          toSqlString: function () {
            return "now()";
          },
        };

        const associatedFolderTagTagIds = associatedFolderTags.map(
          (taggedItem) => taggedItem.item_id
        );
        const associatedPageTagTagIds = associatedPageTags.map(
          (taggedItem) => taggedItem.item_id
        );

        let newItemsArray = [
          ...affectedFolderIds
            .filter((folderId) => !associatedFolderTagTagIds.includes(folderId))
            .map((folderId) => [
              req.body.tag.id,
              folderId,
              0,
              1,
              SYSDATE,
              null,
              req.user.id,
              null,
            ]),
          ...childPageIds
            .filter((pageId) => !associatedPageTagTagIds.includes(pageId))
            .map((pageId) => [
              req.body.tag.id,
              pageId,
              1,
              1,
              SYSDATE,
              null,
              req.user.id,
              null,
            ]),
        ];

        const result = await pool.query(INSERT_NEW_TAGGED_ITEMS, [newItemsArray]);

        if (!result) {
          res.statusMessage = "There was an issue adding new tagged items";
          res.status(409).end();
          return;
        }

        res.send({ result, message: "Successfully added new tagged items" });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/new", isAuth, async (req, res) => {
  try {
    const SEARCH_FOR_EXISTING_TAG = `
      select * from tags 
      where name = $1
      and created_by_id = $2
    `;

    let [existingTag] = await pool.query(SEARCH_FOR_EXISTING_TAG, [
      req.body.name,
      req.user.id,
    ]);

    if (existingTag) {
      res.statusMessage = "This tag already exists";
      res.status(409).end();
      return;
    }

    let GET_TAG_COLOR = ``;
    let sqlParams = [];

    if (req.body.color.is_default_color) {
      sqlParams.push(req.body.color.id);
      GET_TAG_COLOR = `
        select * from default_color_options
        where id = $1
        LIMIT 1;
      `;
    } else {
      sqlParams.push(req.body.color.id, req.user.id);
      GET_TAG_COLOR = `
        select * from user_created_color_options 
        where id = $1
        and created_by_id = $2
        LIMIT 1;
      `;
    }

    const [tagColor] = await pool.query(GET_TAG_COLOR, sqlParams);

    if (!tagColor) {
      res.statusText = "Tag color not found";
      res.status(409).end();
      return;
    }

    const CREATE_TAG = `
      insert into tags (
        name,
        color_id,
        HAS_DEFAULT_COLOR,
        eff_status,
        created_dttm,
        modified_dttm,
        created_by_id,
        modified_by_id
      ) values (
        $1,
        $2,
        $3,
        1,
        now(),
        null,
        $4,
        null
      )
    `;

    let result = await pool.query(CREATE_TAG, [
      req.body.name,
      tagColor.id,
      req.body.color.is_default_color,
      req.user.id,
    ]);

    if (!result) {
      res.statusMessage = "There was an error creating the tag";
      res.status(409).end();
      return;
    }

    const [justCreatedTag] = await getSingleTag(req.user.id, result.insertId);

    if (!justCreatedTag) {
      res.statusMessage = "There was a problem getting revcently created tag";
      res.status(409).end();
      return;
    }

    const itemFromRequest = req.body.item;

    if (req.body.isForItem) {
      await addTaggedItem(
        justCreatedTag.id,
        itemFromRequest.is_page ? itemFromRequest.page_id : itemFromRequest.id,
        itemFromRequest.is_page,
        req.user.id
      );
    }

    res.send({
      result,
      justCreatedTag,
      message: "Tag successfully added",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/edit", isAuth, async (req, res) => {
  try {
    const UPDATE_TAG = `
      update tags 
      set
        name = $1,
        color_id = $2,
        HAS_DEFAULT_COLOR = $3
      where id = $4
    `;

    const result = await pool.query(UPDATE_TAG, [
      req.body.name,
      req.body.color.id,
      req.body.color.is_default_color,
      req.body.id,
    ]);

    if (!result) {
      res.statusMessage = "There was an issue updating this tag";
      res.status(409).end();
      return;
    }

    const [justUpdatedTag] = await getSingleTag(req.user.id, req.body.id);

    if (!justUpdatedTag) {
      res.statusMessage = "There was an issue getting the tag that was just updated";
      res.status(409).end();
      return;
    }

    res.send({ result, justUpdatedTag, message: "Tag successfully edited" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete", isAuth, async (req, res) => {
  try {
    const DELETE_TAG = `
      update tags 
      set
        eff_status = 0,
        modified_dttm = now()
      where id = $1
      and created_by_id = $2
    `;

    const result1 = await pool.query(DELETE_TAG, [req.body.id, req.user.id]);

    if (!result1) {
      res.statusMessage = "There was an error deleting tag";
      res.status(409).end();
      return;
    }

    const UPDATE_TAGGED_ITEMS = `
      update tagged_items
      set 
        eff_status = 0,
        modified_dttm = now()
      where tag_id = $1
      and created_by_id = $2
    `;

    const result2 = await pool.query(UPDATE_TAGGED_ITEMS, [req.body.id, req.user.id]);

    res.send({ result: result2, message: "Tag successfully deleted" });
  } catch (err) {
    console.log(err);
  }
});

async function getTags(reqUserId) {
  const sql = `
    select a.*, 
    case
      when b.color_code IS NOT NULL then b.color_code
      when c.color_code IS NOT NULL then c.color_code
      else '#000000'
    end AS color_code
    from tags a
    LEFT JOIN default_color_options b
    ON a.color_id = b.id
    and b.eff_status = 1
    LEFT JOIN user_created_color_options c
    ON a.color_id = c.id
    and c.created_by_id = $1
    and c.eff_status = 1
    where a.eff_status = 1 
    and a.created_by_id = $2
  `;

  return pool.query(sql, [reqUserId, reqUserId]);
}

async function getSingleTag(reqUserId, tagId) {
  const sql = `
    select a.*,
    case 
      when a.HAS_DEFAULT_COLOR = 1 then b.color_code
      else c.color_code
    end color_code
    from tags a
    LEFT JOIN default_color_options b
    ON a.color_id = b.id
    and b.eff_status = 1
    LEFT JOIN user_created_color_options c
    ON a.color_id = c.id
    and c.eff_status = 1
    and c.created_by_id = $1
    where a.eff_status = 1 
    and a.created_by_id = $2
    and a.id = $3
    LIMIT 1
  `;

  return pool.query(sql, [reqUserId, reqUserId, tagId]);
}

async function addTaggedItem(tagId, itemId, itemIsPage, userId) {
  const ADD_TAGGED_ITEM = `
  insert into tagged_items (
    tag_id,
    item_id,
    is_page,
    eff_status,
    created_dttm,
    modified_dttm,
    created_by_id,
    modified_by_id
  ) values (
    $1,
    $2,
    $3,
    1,
    now(),
    NULL,
    $4,
    NULL
  )
`;

  return pool.query(ADD_TAGGED_ITEM, [tagId, itemId, itemIsPage, userId]);
}

export default router;
