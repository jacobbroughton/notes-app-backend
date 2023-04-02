import { useDispatch, useSelector } from "react-redux";
import "./ItemListItem.css";
import {
  setGrabbedItem,
  setNewFolderName,
  setNewNameForRename,
  setNewPageName,
  setRenameInputToggled,
  setShiftClickItems,
} from "../../../redux/sidebar";
import Caret from "../Icons/Caret";
import PageIcon from "../Icons/PageIcon";
import { renameFolder } from "../../../redux/folders";
import { renamePage } from "../../../redux/pages";
import { RootState } from "../../../redux/store";
import { ItemState } from "../../../types";
import { throwResponseStatusError } from "../../../utils/throwResponseStatusError";
import { ChangeEvent, MouseEvent } from "react";
import { getApiUrl } from "../../../utils/getUrl";

const ItemListItem = ({
  item,
  handleFolderClick,
  handlePageClick,
  handleOnContextMenu,
  handleRename,
  renameInputRef,
  inputPositionRef,
  handleDragEnter,
  handleNewPageSubmit,
  handleNewFolderSubmit,
  handleDrop,
  index,
}: {
  item: ItemState;
  handleFolderClick: Function;
  handlePageClick: Function;
  handleOnContextMenu: Function;
  handleRename: Function;
  renameInputRef: React.MutableRefObject<HTMLInputElement | null>;
  inputPositionRef: React.MutableRefObject<HTMLInputElement | null>;
  handleDragStart: Function;
  handleDragEnter: Function;
  handleNewPageSubmit: Function;
  handleNewFolderSubmit: Function;
  handleDrop: Function;
  index: number;
}) => {
  const sidebar = useSelector((state: RootState) => state.sidebar);
  const tags = useSelector((state: RootState) => state.tags);
  const combined = useSelector((state: RootState) => state.combined);

  const dispatch = useDispatch();

  async function handleRenameSubmit(e: React.FormEvent, item: ItemState) {
    e.preventDefault();
    try {
      if (item.IS_PAGE) {
        const pageInfo = {
          newName: (e.target as HTMLFormElement).newName.value,
          pageId: item.PAGE_ID,
        };

        const response = await fetch(`${getApiUrl()}/pages/rename/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
          body: JSON.stringify(pageInfo),
        });

        if (response.status !== 200) throwResponseStatusError(response, "POST");

        const data = await response.json();

        if (!data) throw "There was an issue parsing /pages/rename response";

        dispatch(renamePage(pageInfo));
      } else {
        const folderInfo = {
          newName: (e.target as HTMLFormElement).newName.value,
          folderId: item.ID,
        };

        const response = await fetch(`${getApiUrl()}/folders/rename/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
          body: JSON.stringify(folderInfo),
        });

        if (response.status !== 200) throwResponseStatusError(response, "POST");

        const data = await response.json();

        if (!data) throw "There was an issue parsing /tags/new response";

        dispatch(renameFolder(folderInfo));
      }
      dispatch(setRenameInputToggled(false));
      dispatch(setNewNameForRename(""));
      renameInputRef.current?.blur();
    } catch (error) {
      console.log(error);
    }
  }

  function handleNewFolderOnChange(e: ChangeEvent) {
    e.preventDefault();
    dispatch(setNewFolderName((e.target as HTMLInputElement).value));
  }

  function handleNewPageOnChange(e: ChangeEvent) {
    e.preventDefault();
    dispatch(setNewPageName((e.target as HTMLInputElement).value));
  }

  function handleDragStart(pickedUpItem: ItemState) {
    dispatch(setGrabbedItem(pickedUpItem));
  }

  function determineFolderContainerClass(itemFromList: ItemState) {
    let className = "folder-container";

    if (!sidebar.dragToggled || sidebar.inputPosition.referenceId !== itemFromList.ID) {
      className += " hoverable";
    }

    if (
      itemFromList.SELECTED ||
      (sidebar.shiftClickItems.start !== null &&
        sidebar.shiftClickItems.end !== null &&
        ((itemFromList.ORDER >= sidebar.shiftClickItems.start &&
          itemFromList.ORDER <= sidebar.shiftClickItems.end) ||
          (itemFromList.ORDER >= sidebar.shiftClickItems.end &&
            itemFromList.ORDER <= sidebar.shiftClickItems.start)))
    ) {
      className += " selected";
    }

    if (
      sidebar.draggedOverItem &&
      (sidebar.draggedOverItem?.ID === itemFromList?.ID ||
        (sidebar.draggedOverItem?.ID === itemFromList?.FOLDER_ID &&
          itemFromList.FOLDER_ID !== null))
    ) {
      if (
        itemFromList.IS_PAGE &&
        itemFromList.FOLDER_ID !== sidebar.grabbedItem?.FOLDER_ID
      ) {
        className += " under-drag";
      }

      if (!itemFromList.IS_PAGE && itemFromList.ID !== sidebar.grabbedItem?.FOLDER_ID) {
        className += " under-drag";
      }
    }

    return className;
  }

  function handleItemClick(e: MouseEvent, item: ItemState) {
    if (e.shiftKey) {
      if (sidebar.shiftClickItems.start !== null) {
        dispatch(
          setShiftClickItems({
            ...sidebar.shiftClickItems,
            end: item.ORDER,
            list: combined,
          })
        );
      }
    } else {
      dispatch(
        setShiftClickItems({
          start: item.ORDER,
          end: null,
          list: combined,
        })
      );
      if (!item.IS_PAGE) handleFolderClick(item, true);
      if (item.IS_PAGE) handlePageClick(item);
    }
  }

  return (
    <div
      draggable={item.IS_PAGE}
      title={`${item.IS_PAGE ? "Page: " : "Folder: "} ${item.NAME}`}
      onDragStart={() => handleDragStart(item)}
      onDragEnter={(e) => handleDragEnter(e, item)}
      onDrop={(e) => handleDrop(e, sidebar.grabbedItem, item)}
      onDragOver={(e) => e.preventDefault()}
      onDoubleClick={(e) => (item.IS_PAGE ? handleRename(e, item) : null)}
      className={determineFolderContainerClass(item)}
      style={{
        ...(sidebar.inputPosition.referenceId === item.ID &&
          sidebar.inputPosition.toggled && { overflow: "visible" }),
      }}
      key={index}
      onContextMenu={(e) => handleOnContextMenu(e, item)}
      onClick={(e) => handleItemClick(e, item)}
    >
      <div className="tier-blocks">
        {[...Array(item.TIER)].map((tierNum, index) => (
          <div key={index} className="tier-block">
            &nbsp;
          </div>
        ))}
      </div>
      <div
        className={`name-and-buttons`}
        data-tier={`${item.TIER ? `TIER-${item.TIER}` : "null"}`}
      >
        <div className="name-and-caret">
          <div className="caret-container">
            {!item.IS_PAGE && (
              <Caret direction={item.EXPANDED_STATUS ? "down" : "right"} />
            )}
            {item.IS_PAGE && <PageIcon />}
          </div>
          {sidebar.renameInputToggled &&
          sidebar.inputPosition.referenceId === (item.PAGE_ID || item.ID) ? (
            <form onSubmit={(e) => handleRenameSubmit(e, item)}>
              <input
                value={sidebar.newNameForRename}
                name="newName"
                spellCheck="false"
                onChange={(e) => dispatch(setNewNameForRename(e.target.value))}
                className="rename-input"
                ref={renameInputRef}
                autoComplete="off"
              />
            </form>
          ) : (
            <p>{item.NAME}</p>
          )}
        </div>
        {item.TAGS && tags.list && (
          <div className="tags">
            {item.TAGS.map((tagId, index) => {
              const tag = tags.list?.find((tag) => tag.ID === tagId);

              if (!tag)
                return (
                  <span
                    className="tag-color"
                    style={{ backgroundColor: "black" }}
                    key={index}
                    title="Unknown Color (something happened)"
                  >
                    &nbsp;
                  </span>
                );

              return (
                <span
                  className="tag-color"
                  style={{ backgroundColor: tag.COLOR_CODE }}
                  key={index}
                  title={tag.NAME}
                >
                  &nbsp;
                </span>
              );
            })}
          </div>
        )}
      </div>
      {sidebar.inputPosition.referenceId === item.ID && sidebar.inputPosition.toggled && (
        <form
          onSubmit={(e) => {
            if (sidebar.inputPosition.forFolder) {
              handleNewFolderSubmit(e);
            } else {
              handleNewPageSubmit(e);
            }
          }}
          style={{ paddingLeft: `calc(${item.TIER} * 10px)` }}
          className="new-folder-form"
        >
          <input
            ref={inputPositionRef}
            onClick={(e) => e.stopPropagation()}
            spellCheck="false"
            onChange={(e) => {
              if (sidebar.inputPosition.forFolder) {
                handleNewFolderOnChange(e);
              } else {
                handleNewPageOnChange(e);
              }
            }}
            value={
              sidebar.inputPosition.forFolder
                ? sidebar.newFolderName
                : sidebar.newPageName
            }
            autoComplete="off"
          />
        </form>
      )}
    </div>
  );
};
export default ItemListItem;
