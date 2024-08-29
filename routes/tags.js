import express from "express";
import { pool } from "../config/database.js";
import { isAuth } from "../authMiddleware.js";
import util from "util";
import { body } from "express-validator";

const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  try {
    let result = await getTags(req.user.id);

    if (!result.rows) throw "No tags found";

    res.send(result.rows);
  } catch (err) {
    console.log(err);
  }
});

router.get("/color-options", isAuth, async (req, res) => {
  try {
    const GET_DEFAULT_COLORS = `
    select *
    from default_color_options
    where eff_status = 1
  `;

    const result = await pool.query(GET_DEFAULT_COLORS);

    if (!result) {
      res.statusText = "Failed to fetch default color options";
      res.status(409).end();
      return;
    }

    res.send({
      result: result.rows,
      message: "Successfully got color options",
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

    if (!result1) {
      res.statusText = "Failed to delete custom color";
      res.status(409).end();
      return;
    }

    const UPDATE_ASSOCIATED_tags = `
    update [tagged_items]
    set 
      eff_status = 0,
      modified_dttm = now()
    where color_id = $1
    `;

    const result2 = await pool.query(UPDATE_ASSOCIATED_tags, [req.body.colorId]);

    res.send({
      result: result2,
      justCreatedColor,
      message: "Successfully deleted custom color option",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/tag-folder", isAuth, async (req, res) => {
  try {
    const itemId = req.body.item.id;

    const CHECK_IF_ITEM_IS_TAGGED = `
    select * from tagged_items
    where item_id = $1
  `;

    const result = await pool.query(CHECK_IF_ITEM_IS_TAGGED, [itemId]);

    const existingTaggedItem = result.rows[0];

    console.log({ existingTaggedItem });

    const GET_FOLDERS = `
    select *
    from folders
    where eff_status = 1
    and created_by_id = $1
  `;

    let result2 = await pool.query(GET_FOLDERS, [req.user.id]);

    const allFoldersByUser = result2.rows;

    let affectedFolderIds = [];

    function getAffectedFolderIds(folderIdToCheck) {
      affectedFolderIds.push(folderIdToCheck);

      const children = allFoldersByUser
        .filter((folder) => folder.parent_folder_id === folderIdToCheck)
        .map((folder) => folder.id);

      if (children.length === 0) return;

      children.forEach((folderId) => getAffectedFolderIds(folderId));
    }

    getAffectedFolderIds(req.body.item.id);

    const GET_CHILD_PAGES = `
    select * 
    from pages 
    where folder_id = any ($1::int[])
    and eff_status = 1
    and created_by_id = $2
  `;

    let result3 = await pool.query(GET_CHILD_PAGES, [affectedFolderIds, req.user.id]);

    const childPageIds = result3.rows.map((page) => page.page_id);

    const get_associated_folder_tags = `
  select * from tagged_items
  where tag_id = $1
  and is_page = 0
  and item_id = any($2::int[])
`;

    const { rows: associatedFolderTags } = await pool.query(get_associated_folder_tags, [
      req.body.tag.id,
      affectedFolderIds,
    ]);

    const associatedFolderTagIds = associatedFolderTags.map(
      (taggedItem) => taggedItem.item_id
    );

    let associatedPageTags = [];
    let associatedPageTagIds = [];

    if (childPageIds.length > 0) {
      const GET_ASSOCIATED_PAGE_TAGS = `
        select * from tagged_items
        where tag_id = $1
        and is_page = 1
        and case
          when $2=1 then item_id = any($3::int[])
          else 1=1
        end
      `;

      const { rows: associatedPageTags } = await pool.query(GET_ASSOCIATED_PAGE_TAGS, [
        req.body.tag.id,
        childPageIds.length !== 0 ? 1 : 0,
        childPageIds.length !== 0 ? childPageIds : "null",
      ]);

      associatedPageTagIds = associatedPageTags.map((taggedPage) => taggedPage.id);
    }

    if (existingTaggedItem) {
      const UPDATE_EXISTING_TAGGED_FOLDERS = `
        update tagged_items
        set 
          eff_status = $1,
          modified_dttm = now(),
          tag_id = $2
        --where id = any($3::int[])
        where id = $3
      `;

      let result = await pool.query(UPDATE_EXISTING_TAGGED_FOLDERS, [
        req.body.tag.id === existingTaggedItem.tag_id && existingTaggedItem.eff_status
          ? 0
          : 1,
        req.body.tag.id,
        existingTaggedItem.id,
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
          where id = any($2::int[])
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
      const associatedPageTagIds = associatedPageTags.map(
        (taggedItem) => taggedItem.item_id
      );

      let newItemsArray = [
        ...affectedFolderIds
          .filter((folderId) => !associatedFolderTagIds.includes(folderId))
          .map((folderId) => [req.body.tag.id, folderId, 0, req.user.id]),
        ...childPageIds
          .filter((pageId) => !associatedPageTagIds.includes(pageId))
          .map((pageId) => [req.body.tag.id, pageId, 1, req.user.id]),
      ];

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
    ) values ${newItemsArray
      .map(
        (_, i) =>
          `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, 1, now(), null, $${
            i * 7 + 4
          }, null)`
      )
      .join(", ")}
  `;

      const values = newItemsArray.flat();

      const result = await pool.query(INSERT_NEW_TAGGED_ITEMS, [...values]);

      if (!result) {
        res.statusMessage = "There was an issue adding new tagged items";
        res.status(409).end();
        return;
      }

      res.send({ result, message: "Successfully added new tagged items" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/tag-page", isAuth, async (req, res) => {
  try {
    const isPage = req.body.item.is_page;
    const itemId = isPage ? req.body.item.page_id : req.body.item.id;

    const CHECK_IF_ITEM_IS_TAGGED = `
    select * from tagged_items
    where item_id = $1
  `;

    const result = await pool.query(CHECK_IF_ITEM_IS_TAGGED, [itemId]);

    const existingTaggedItem = result.rows[0];
    console.log(req.body);

    if (existingTaggedItem) {
      if (existingTaggedItem.id === req.body.tag.id) {
        const ENABLE_OR_DISABLE_TAGGED_ITEM = `
              update tagged_items
              set 
                eff_status = $1,
                modified_dttm = now()
              where id = $2
            `;

        const result = await pool.query(ENABLE_OR_DISABLE_TAGGED_ITEM, [
          existingTaggedItem.eff_status ? 0 : 1,
          existingTaggedItem.id,
        ]);

        res.send({ result, message: "Tag successfully disabled" });
      } else {
        const update_tagged_item = `
            update tagged_items
            set tag_id = $1,
              modified_dttm = now(),
              modified_by_id = $2,
              eff_status = 1
            where id = $3
          `;

        const result = await pool.query(update_tagged_item, [
          req.body.tag.id,
          req.user.id,
          existingTaggedItem.id,
        ]);

        console.log(result);

        res.send({ result, message: "Tag successfully updated" });
      }
    } else {
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
      const result = await pool.query(ADD_TAGGED_ITEM, [
        req.body.tag.id,
        itemId,
        isPage ? 1 : 0,
        req.user.id,
      ]);

      res.send({ result, message: "Tag successfully added" });
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

    console.log(req.body);

    let result = await pool.query(SEARCH_FOR_EXISTING_TAG, [req.body.name, req.user.id]);

    if (result.rows?.length >= 1) {
      res.statusMessage = "This tag already exists";
      res.status(409).end();
      return;
    }

    // const GET_TAG_COLOR = `
    //     select * from default_color_options
    //     where id = $1
    //     limit 1;
    //   `;

    // const result2 = await pool.query(GET_TAG_COLOR, [req.body.color.id]);

    // if (!result2) {
    //   res.statusText = "Tag color not found";
    //   res.status(409).end();
    //   return;
    // }

    // console.log(result2)

    const CREATE_TAG = `
      insert into tags (
        name,
        color_id,
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
      ) returning id
    `;

    let result2 = await pool.query(CREATE_TAG, [
      req.body.name,
      req.body.color.id,
      req.user.id,
    ]);

    if (!result2) {
      res.statusMessage = "There was an error creating the tag";
      res.status(409).end();
      return;
    }

    console.log(result2);

    const result3 = await getSingleTag(req.user.id, result2.rows[0].id);

    if (!result3) {
      res.statusMessage = "There was a problem getting recently created tag";
      res.status(409).end();
      return;
    }

    const itemFromRequest = req.body.item;

    const justCreatedTag = result3.rows[0];

    // const result4 = await addTaggedItem(
    //     justCreatedTag.id,
    //     itemFromRequest.is_page ? itemFromRequest.page_id : itemFromRequest.id,
    //     itemFromRequest.is_page,
    //     req.user.id
    //   );

    // console.log('HERE', result4)

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
        color_id = $2
      where id = $3
    `;

    const result = await pool.query(UPDATE_TAG, [
      req.body.name,
      req.body.color_id,
      req.body.tag_id,
    ]);

    if (!result) {
      res.statusMessage = "There was an issue updating this tag";
      res.status(409).end();
      return;
    }

    const result2 = await getSingleTag(req.user.id, req.body.tag_id);

    console.log(result2.rows);

    if (!result2) {
      res.statusMessage = "There was an issue getting the tag that was just updated";
      res.status(409).end();
      return;
    }

    res.send({
      result,
      justModifiedTag: result2.rows[0],
      message: "Tag successfully edited",
    });
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
      else '#000000'
    end AS color_code
    from tags a
    left join default_color_options b
    on a.color_id = b.id
    and b.eff_status = 1
    where a.eff_status = 1 
    and a.created_by_id = $1
  `;

  return pool.query(sql, [reqUserId]);
}

async function getSingleTag(reqUserId, tagId) {
  const sql = `
    select a.*,
    b.color_code
    from tags a
    left join default_color_options b
    on a.color_id = b.id
    and b.eff_status = 1
    where a.eff_status = 1 
    and a.created_by_id = $1
    and a.id = $2
    limit 1
  `;

  return pool.query(sql, [reqUserId, tagId]);
}

async function addTaggedItem(tagId, itemId, itemIsPage, userId) {
  console.log({ tagId, itemId, itemIsPage, userId });
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

  return pool.query(ADD_TAGGED_ITEM, [tagId, itemId, itemIsPage ? 1 : 0, userId]);
}

export default router;
