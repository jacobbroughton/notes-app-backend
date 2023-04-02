import React, { MouseEvent, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setExpandedStatus, selectFolder, renameFolder } from "../../../redux/folders";
import {
  setDraggedOverItem,
  setGrabbedItem,
  setInputPosition,
  setNewFolderName,
  setNewPageName,
  setShiftClickItems,
} from "../../../redux/sidebar";
import { selectPage, updateParentFolderId } from "../../../redux/pages";
import { throwResponseStatusError } from "../../../utils/throwResponseStatusError";
import { setCombined } from "../../../redux/combined";
import ItemListItem from "../ItemListItem/ItemListItem";
import { RootState } from "../../../redux/store";
import { SidebarItemState, ItemState, FolderState, PageState } from "../../../types";
import "./ItemList.css";
import { getApiUrl } from "../../../utils/getUrl";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const ItemList = ({
  setContextMenu,
  handleNewFolderSubmit,
  handleNewPageSubmit,
  inputPositionRef,
  resetContextMenu,
  handleRename,
  renameInputRef,
}: {
  setContextMenu: Function;
  handleNewFolderSubmit: Function;
  handleNewPageSubmit: Function;
  inputPositionRef: React.MutableRefObject<HTMLInputElement | null>;
  resetContextMenu: Function;
  handleRename: Function;
  renameInputRef: React.MutableRefObject<HTMLInputElement | null>;
}) => {
  const dispatch = useDispatch();
  const folders = useSelector((state: RootState) => state.folders);
  const pages = useSelector((state: RootState) => state.pages);
  const sidebar = useSelector((state: RootState) => state.sidebar);
  const combined = useSelector((state: RootState) => state.combined);

  function handleRootClick() {
    dispatch(
      setInputPosition({
        referenceId: 0,
        toggled: false,
        forFolder: true,
      })
    );
    dispatch(setShiftClickItems({ start: null, end: null, list: [] }));
    resetContextMenu();
    dispatch(selectFolder(null));
    dispatch(selectPage(null));
  }

  function handleFolderClick(folder: ItemState, changeExpandedStatus = false) {
    changeExpandedStatus && dispatch(setExpandedStatus(folder));
    dispatch(selectFolder(folder));
    dispatch(selectPage(null));
    dispatch(
      setInputPosition({
        referenceId: folder.ID,
        toggled: false,
        forFolder: true,
      })
    );
  }

  function handlePageClick(page: PageState) {
    dispatch(selectPage(page));
    dispatch(selectFolder(null));
    dispatch(
      setInputPosition({
        referenceId: page.PAGE_ID,
        toggled: false,
        forFolder: false,
      })
    );
  }

  function handleOnContextMenu(e: MouseEvent, item: any) {
    e.preventDefault();
    if (!sidebar.shiftClickItems.end) {
      if (item) {
        if (!item.IS_PAGE) handleFolderClick(item, false);
        if (item.IS_PAGE) handlePageClick(item);
      } else {
        handleRootClick();
      }
    }

    let x = e.clientX;
    let y = e.clientY;

    if (y > window?.innerHeight - 100) {
      y = window.innerHeight - 100;
    }

    setContextMenu({
      position: {
        y,
        x,
      },
      toggled: true,
    });
  }

  function handleDragStart(pickedUpItem: SidebarItemState) {
    dispatch(setGrabbedItem(pickedUpItem));
  }

  async function handleDrop(
    grabbedItem: SidebarItemState | null,
    droppedOntoItem: SidebarItemState | null
  ) {
    try {
      if (grabbedItem?.IS_PAGE) {
        dispatch(
          updateParentFolderId({
            folders: folders.list,
            affectedPage: grabbedItem,
            droppedOntoItem,
          })
        );

        const response = await fetch(`${getApiUrl()}pages/updateParentFolder/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
          body: JSON.stringify({
            affectedPage: grabbedItem,
            droppedOntoItem,
          }),
        });

        if (response.status !== 200) throwResponseStatusError(response, "POST");

        const data = await response.json();

        if (!data) throw "There was an issue parsing /pages/updateParentFolder response";
      }

      dispatch(setGrabbedItem(null));
      dispatch(
        setDraggedOverItem({
          ID: null,
          PAGE_ID: null,
        })
      );
    } catch (error) {
      console.log(error);
    }
  }

  function handleDragEnter(e: MouseEvent, hoveredOverItem: ItemState | null) {
    let ID = null;
    if (hoveredOverItem) {
      if (hoveredOverItem.IS_PAGE) {
        ID = hoveredOverItem.FOLDER_ID;
      } else {
        ID = hoveredOverItem.ID;
      }
    } else {
      ID = null;
    }

    dispatch(
      setDraggedOverItem({
        ID,
        ...(hoveredOverItem && { PAGE_ID: hoveredOverItem.PAGE_ID }),
      })
    );
  }

  useEffect(() => {
    if (sidebar.inputPosition.toggled) inputPositionRef?.current?.focus();
  }, [sidebar.inputPosition.toggled]);

  useEffect(() => {
    let pagesAndFolders: Array<FolderState | PageState> = [...folders?.list].filter(
      (folder) => folder.EFF_STATUS
    );
    let effFolders = [...folders?.list].filter((folder) => folder.EFF_STATUS);

    const pagesInRoot = pages.list.filter(
      (page) => page.FOLDER_ID === null && page.EFF_STATUS
    );

    let indexAfterAddingPages = 1;

    effFolders?.forEach((folder, index) => {
      const pagesInFolder = pages.list.filter(
        (page) => page.FOLDER_ID === folder.ID && page.EFF_STATUS
      );

      if (pagesInFolder.length > 0) {
        pagesAndFolders.splice(indexAfterAddingPages, 0, ...pagesInFolder);
      }

      indexAfterAddingPages += pagesInFolder.length + 1;
    });

    pagesAndFolders.push(...pagesInRoot);

    pagesAndFolders = pagesAndFolders.map((item, i) => {
      return {
        ...item,
        ORDER: i,
      };
    });

    dispatch(setCombined(pagesAndFolders));
  }, [folders.list, pages.list]);

  const favoritesList = pages.list.filter((page) => page.IS_FAVORITE && page.EFF_STATUS);

  const allList = combined?.filter((folder) => folder?.VISIBLE && !folder.IS_FAVORITE);

  return (
    <div
      className={`items-list ${
        sidebar.inputPosition.referenceId === 0 ? "selected" : ""
      }`}
    >
      {favoritesList.length !== 0 && (
        <p className="item-list-heading favorites">Favorites</p>
      )}
      {favoritesList.map((item, index) => (
        <ItemListItem
          item={{
            ...item,
            TIER: 1,
            EXPANDED_STATUS: false,
            ORDER: favoritesList.length + 1,
            PARENT_FOLDER_ID: item.FOLDER_ID,
          }}
          handleFolderClick={handleFolderClick}
          handlePageClick={handlePageClick}
          handleOnContextMenu={handleOnContextMenu}
          handleRename={handleRename}
          handleDragEnter={handleDragEnter}
          handleDragStart={handleDragStart}
          handleDrop={handleDrop}
          handleNewPageSubmit={handleNewPageSubmit}
          handleNewFolderSubmit={handleNewFolderSubmit}
          renameInputRef={renameInputRef}
          inputPositionRef={inputPositionRef}
          index={index}
          key={index}
        />
      ))}
      {favoritesList.length !== 0 && <div className="spacer"></div>}
      <div className='item-list-heading-and-spinner'>
        <p className="item-list-heading all">All </p>
        {/* {sidebar.loading && <LoadingSpinner />} */}
      </div>
      {allList.length === 0 && <p className="no-items-found">No items found</p>}

      {allList.map((item, index) => {
        let hasChildren =
          folders.list.filter((innerFolder) => innerFolder.PARENT_FOLDER_ID === item.ID)
            .length !== 0;

        if (!hasChildren && !item.IS_PAGE) {
          if (pages.list?.find((page) => page.FOLDER_ID === item.ID)) {
            hasChildren = true;
          }
        }

        return (
          <ItemListItem
            item={item}
            handleFolderClick={handleFolderClick}
            handlePageClick={handlePageClick}
            handleOnContextMenu={handleOnContextMenu}
            handleRename={handleRename}
            handleDragEnter={handleDragEnter}
            handleDragStart={handleDragStart}
            handleDrop={handleDrop}
            handleNewPageSubmit={handleNewPageSubmit}
            handleNewFolderSubmit={handleNewFolderSubmit}
            key={index}
            renameInputRef={renameInputRef}
            inputPositionRef={inputPositionRef}
            index={index}
          />
        );
      })}
      {sidebar.inputPosition.toggled && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            dispatch(
              setInputPosition({
                referenceId: null,
                toggled: false,
                forFolder: false,
              })
            );
            if (sidebar.newPageName) dispatch(setNewPageName(""));
            if (sidebar.newFolderName) dispatch(setNewFolderName(""));
          }}
        ></div>
      )}
      <div
        className="sidebar-root-click-checker"
        onContextMenu={(e) => handleOnContextMenu(e, null)}
        onClick={handleRootClick}
        draggable
        onDragStart={(e) => e.preventDefault()}
        onDragEnter={(e) => handleDragEnter(e, null)}
        onDrop={() => handleDrop(sidebar.grabbedItem, null)}
        onDragOver={(e) => e.preventDefault()}
        style={{
          height: `calc(100% - ${
            combined?.filter((folder) => folder?.VISIBLE).length * 26 + 40 + 115
          }px)`,
        }}
      >
        &nbsp;
      </div>
    </div>
  );
};

export default ItemList;
