import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteTag, deselectTag, editTag, selectTag, addTag } from "../../../redux/tags";
import TrashIcon from "../Icons/TrashIcon";
import DownArrow from "../Icons/DownArrow";
import "./TagsSidebarView.css";
import { setNewTagFormToggled } from "../../../redux/sidebar";
import ColorPicker from "../ColorPicker/ColorPicker";
import Tag from "../Tag/Tag";
import { throwResponseStatusError } from "../../../utils/throwResponseStatusError";
import { RootState } from "../../../redux/store";
import { TagState, ColorState } from "../../../types";
import { getApiUrl } from "../../../utils/getUrl";

const TagsSidebarView = () => {
  const dispatch = useDispatch();
  const tags = useSelector((state: RootState) => state.tags);
  const sidebar = useSelector((state: RootState) => state.sidebar);
  const [tagSearchValue, setTagSearchValue] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState<ColorState | null>(null);
  const [newTagName, setNewTagName] = useState<string>("");
  const [updatedTagColor, setUpdatedTagColor] = useState<ColorState | null>(null);
  const [updatedTagName, setUpdatedTagName] = useState<string>(tags.selected?.NAME || "");
  const [deleteWarningToggled, setDeleteWarningToggled] = useState<boolean>(false);

  function determineDefaultColor(tag: TagState): ColorState {
    let matchingDefaultColor: ColorState | undefined;

    if (tag.HAS_DEFAULT_COLOR) {
      matchingDefaultColor = tags.colorOptions.default.find(
        (color) => color.ID === tag.COLOR_ID
      );
    } else {
      console.log(tags.colorOptions.userCreated, tag);
      matchingDefaultColor = tags.colorOptions.userCreated.find(
        (color) => color.ID === tag.COLOR_ID
      );
    }

    if (matchingDefaultColor) return matchingDefaultColor;
    return {
      ID: -1,
      COLOR_CODE: "#000000",
      EFF_STATUS: 1,
      CREATED_DTTM: `${new Date()}`,
      MODIFIED_DTTM: "",
      IS_DEFAULT_COLOR: 1,
    };
  }

  function handleTagClick(tag: TagState) {
    dispatch(selectTag(tag));
    setUpdatedTagName(tag.NAME);
    setUpdatedTagColor(determineDefaultColor(tag));
  }

  function handleUpdatedColorChange(color: ColorState) {
    setUpdatedTagColor(color);
  }

  function handleNewColorChange(color: ColorState) {
    setNewTagColor(color);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  function isValidColor(strColor: string | undefined): boolean {
    if (!strColor) return false;

    const s = new Option().style;
    s.color = strColor;
    return s.color !== "";
  }

  function isValidTagName(strName: string, canBeEmpty: boolean) {
    if (canBeEmpty) return true;
    return strName !== "";
  }

  async function handleTagEdit(
    updatedTagName: string,
    updatedTagColor: ColorState | null,
    tagId: number
  ) {
    try {
      const payload = {
        name: updatedTagName,
        color: updatedTagColor,
        id: tagId,
      };

      const response = await fetch(`${getApiUrl()}/tags/edit/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was an issue parsing /tags/edit response";

      dispatch(editTag(payload));
      dispatch(deselectTag());
    } catch (error) {
      console.log(error);
    }
  }

  async function handleNewTag(
    newTagName: string,
    newColor: ColorState | null,
    tagId?: number
  ) {
    try {
      const payload = {
        name: newTagName,
        color: newColor,
        id: tagId,
      };

      const response = await fetch(`${getApiUrl()}/tags/new/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was an issue parsing /tags/new response";

      const justCreatedTag = data.justCreatedTag;

      dispatch(addTag(justCreatedTag));
      dispatch(deselectTag());
      console.log("new tag created");
      setNewTagColor(null);
      setNewTagName("");
      dispatch(setNewTagFormToggled(false));
    } catch (error) {
      console.log(error);
    }
  }

  async function handleTagDelete(tagId: number) {
    try {
      const payload = {
        id: tagId,
      };

      const response = await fetch(`${getApiUrl()}/tags/delete/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was an issue parsing /tags/delete response";

      dispatch(deleteTag(payload));
      dispatch(deselectTag());
      setDeleteWarningToggled(false);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (tags.selected) setUpdatedTagColor(determineDefaultColor(tags.selected));
  }, [tags.selected]);

  return (
    <div className="tags-sidebar-view">
      {tags.selected === null && !sidebar.newTagFormToggled && (
        <>
          <form className="tag-search-form">
            <input
              value={tagSearchValue}
              onChange={(e) => setTagSearchValue(e.target.value)}
              placeholder="Search for a tag"
              autoComplete="off"
            />
          </form>
          {tags.list.length === 0 && <p className="no-tags-found">No tags found</p>}
          {tags.list
            ?.filter((tag) => tag.NAME.includes(tagSearchValue))
            .map((tag, i) => {
              return (
                <button
                  onClick={() => handleTagClick(tag)}
                  className={`tag-button ${tag.SELECTED ? "selected" : ""}`}
                  key={i}
                  title={`Tag: ${tag.NAME}`}
                >
                  <span
                    className="color-span"
                    style={{ backgroundColor: tag.COLOR_CODE }}
                    title={`Color: ${tag.COLOR_CODE}`}
                  >
                    &nbsp;
                  </span>
                  <p>{tag.NAME}</p>
                </button>
              );
            })}
        </>
      )}
      {sidebar.newTagFormToggled && (
        <div className="tag-form-container">
          <div className="cancel-and-done-btns">
            <button
              onClick={() => {
                dispatch(setNewTagFormToggled(false));
                setNewTagColor(null);
                setNewTagName("");
              }}
              title="Cancel / Discard New Tag"
            >
              Cancel
            </button>
            <button
              onClick={(e) => handleNewTag(newTagName, newTagColor)}
              disabled={
                !isValidTagName(newTagName, false) ||
                !isValidColor(newTagColor?.COLOR_CODE)
              }
              title="Done / Confirm New Tag"
            >
              Done
            </button>
          </div>
          <form className="tag-form" onSubmit={handleSubmit}>
            <p className="new-tag-header">Create a tag</p>
            <div className="tag-name">
              <label>Tag Name</label>
              <input
                placeholder='"Expenses", "High Priority", etc.'
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className={isValidTagName(newTagName, true) ? "" : "invalid"}
                autoComplete="off"
              />
              {!isValidTagName(newTagName, true) && (
                <p className="invalid-text">Invalid name</p>
              )}
            </div>
            <div className="tag-color">
              <label>Tag Color</label>
              <div className="inputs">
                <ColorPicker
                  onColorSelect={handleNewColorChange}
                  selectedColor={newTagColor}
                  showColorCode={true}
                />
              </div>
              {newTagColor && !isValidColor(newTagColor?.COLOR_CODE) && (
                <p className="invalid-text">Invalid color</p>
              )}
            </div>
          </form>
          <Tag name={newTagName ? newTagName : "-"} color={newTagColor} />
        </div>
      )}
      {tags.selected && (
        <div className="tag-form-container">
          <div className="cancel-and-done-btns">
            <button
              onClick={() => {
                setDeleteWarningToggled(false);
                dispatch(setNewTagFormToggled(false));
                dispatch(deselectTag());
                setUpdatedTagColor(null);
                setUpdatedTagName("");
              }}
              title="Cancel / Discard Edit"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                handleTagEdit(updatedTagName, updatedTagColor, tags.selected?.ID!)
              }
              disabled={
                (updatedTagName === tags.selected?.NAME &&
                  updatedTagColor?.COLOR_CODE === tags.selected?.COLOR_CODE) ||
                !isValidTagName(updatedTagName, false) ||
                !isValidColor(updatedTagColor?.COLOR_CODE)
              }
              title="Done / Confirm Edit"
            >
              Done
            </button>
          </div>
          <form onSubmit={handleSubmit} className="tag-form">
            <p className="new-tag-header">Edit tag</p>
            <div className="tag-name">
              <label>Tag Name</label>
              <input
                value={updatedTagName}
                onChange={(e) => setUpdatedTagName(e.target.value)}
                className={isValidTagName(updatedTagName, false) ? "" : "invalid"}
                autoComplete="off"
              />
              {!isValidTagName(updatedTagName, false) && (
                <p className="invalid-text">Invalid name</p>
              )}
            </div>
            <div className="tag-color">
              <label>Tag Color</label>
              <div className="inputs">
                <ColorPicker
                  onColorSelect={handleUpdatedColorChange}
                  selectedColor={updatedTagColor}
                  showColorCode={true}
                />
              </div>
              {!isValidColor(updatedTagColor?.COLOR_CODE) && (
                <p className="invalid-text">Invalid color</p>
              )}
            </div>
          </form>
          <Tag name={tags.selected.NAME} color={determineDefaultColor(tags.selected)} />

          <DownArrow />
          {updatedTagName !== tags.selected.NAME ||
          updatedTagColor?.COLOR_CODE !==
            determineDefaultColor(tags.selected)?.COLOR_CODE ? (
            <Tag
              name={updatedTagName ? updatedTagName : "-"}
              color={
                isValidColor(updatedTagColor?.COLOR_CODE)
                  ? updatedTagColor
                  : determineDefaultColor(tags.selected)
              }
            />
          ) : (
            <p className="no-changes">No changes made yet</p>
          )}
        </div>
      )}

      {tags.selected && (
        <div className="tag-controls">
          {!deleteWarningToggled && (
            <button
              className="trash-button"
              title="Delete Tag"
              onClick={() => setDeleteWarningToggled(true)}
            >
              <TrashIcon />
            </button>
          )}
          {deleteWarningToggled && (
            <div className="are-you-sure-container">
              <p>Are you sure?</p>
              <button
                onClick={() => handleTagDelete(tags.selected!.ID)}
                className="confirm"
              >
                Yes
              </button>
              <button onClick={(e) => setDeleteWarningToggled(false)} className="cancel">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagsSidebarView;
