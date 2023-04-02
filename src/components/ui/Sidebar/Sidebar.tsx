import React, { useState, useEffect, useRef, Context, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFolders,
  collapseFolders,
  expandFolders,
  deselectFolder,
  setStagedFolderToDelete,
} from "../../../redux/folders";
import { setFavoriteStatus, setPages, setStagedPageToDelete } from "../../../redux/pages";
import {
  setSidebarWidth,
  setSidebarView,
  setNewTagFormToggled,
  setDragToggled,
  setRenameInputToggled,
  setNewNameForRename,
  setNewPageName,
  setNewFolderName,
  setSidebarLoading,
} from "../../../redux/sidebar";
import { formatFolders, formatPages } from "../../../utils/formatData";
import { toggleModal } from "../../../redux/modals";
import { setTheme } from "../../../redux/theme";
import ContextMenu from "../ContextMenu/ContextMenu";
import UserMenu from "../UserMenu/UserMenu";
import ItemList from "../ItemList/ItemList";
import PageSearch from "../PageSearch/PageSearch";
import SearchIcon from "../Icons/SearchIcon";
import TagIcon from "../Icons/TagIcon";
import UserIcon from "../Icons/UserIcon";
import PageIcon from "../Icons/PageIcon";
import "./Sidebar.css";
import TagsSidebarView from "../TagsSidebarView/TagsSidebarView";
import { throwResponseStatusError } from "../../../utils/throwResponseStatusError";
import { setInputPosition } from "../../../redux/sidebar";
import { ItemState } from "../../../types";
import { RootState } from "../../../redux/store";
import { getApiUrl } from "../../../utils/getUrl";

function Sidebar() {
  const sidebarRef = useRef<HTMLElement | null>(null);
  const inputPositionRef = useRef<HTMLInputElement | null>(null);
  const contextMenuRef = useRef<HTMLMenuElement | null>(null);
  const draggableRef = useRef<HTMLMenuElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: {
      x: number;
      y: number;
    };
    toggled: boolean;
  }>({
    position: {
      x: 0,
      y: 0,
    },
    toggled: false,
  });
  const [userMenuToggled, setUserMenuToggled] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const folders = useSelector((state: RootState) => state.folders);
  const pages = useSelector((state: RootState) => state.pages);
  const tags = useSelector((state: RootState) => state.tags);
  const sidebar = useSelector((state: RootState) => state.sidebar);
  const theme = useSelector((state: RootState) => state.theme);
  const combined = useSelector((state: RootState) => state.combined);
  const dispatch = useDispatch();

  const startResizing = useCallback(() => {
    setIsResizingSidebar(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingSidebar(false);
  }, []);

  const resizeSidebar = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizingSidebar && sidebarRef.current) {
        const newSidebarPositionX =
          mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
        if (newSidebarPositionX >= 50) dispatch(setSidebarWidth(newSidebarPositionX));
      }
    },
    [isResizingSidebar]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resizeSidebar);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resizeSidebar, stopResizing]);

  async function handleNewFolderSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch(`${getApiUrl()}/folders/new/`, {
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        credentials: "include",
        body: JSON.stringify({
          parentFolderId:
            sidebar.inputPosition.referenceId === 0
              ? null
              : sidebar.inputPosition.referenceId,
          newFolderName: sidebar.newFolderName,
        }),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was an issue parsing /tags/new response";

      dispatch(
        setInputPosition({
          referenceId: null,
          toggled: false,
          forFolder: false,
        })
      );
      dispatch(setNewFolderName(""));
      resetContextMenu();
      getData();
    } catch (error) {
      console.log(error);
    }
  }

  async function handleNewPageSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch(`${getApiUrl()}/pages/new/`, {
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        credentials: "include",
        body: JSON.stringify({
          parentFolderId:
            sidebar.inputPosition.referenceId === 0
              ? null
              : sidebar.inputPosition.referenceId,
          newPageName: sidebar.newPageName,
        }),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was an issue parsing /pages/new response";

      dispatch(
        setInputPosition({
          referenceId: null,
          toggled: false,
          forFolder: false,
        })
      );
      dispatch(setNewPageName(""));
      resetContextMenu();
      getData();
    } catch (error) {
      console.log(error);
    }
  }

  function handleDeleteSingle(e: MouseEvent, item: any) {
    e.stopPropagation();
    dispatch(toggleModal("deleteModal"));
    if (item.IS_PAGE) {
      dispatch(setStagedPageToDelete(item));
    } else {
      dispatch(setStagedFolderToDelete(item));
    }
    dispatch(
      setInputPosition({
        referenceId: null,
        toggled: false,
        forFolder: false,
      })
    );
    resetContextMenu();
  }

  function handleDeleteMultiple() {
    dispatch(toggleModal("deleteModal"));
    dispatch(
      setInputPosition({
        referenceId: null,
        toggled: false,
        forFolder: false,
      })
    );
    resetContextMenu();
  }

  function handleRename(e: MouseEvent, item: ItemState) {
    e.stopPropagation();

    resetContextMenu();
    // console.log(item);

    new Promise((resolve) => {
      dispatch(setRenameInputToggled(true));
      dispatch(setNewNameForRename(item.NAME));
      resetContextMenu();
      resolve("success");
    }).then(() => {
      if (renameInputRef.current) {
        renameInputRef?.current.focus();
        renameInputRef?.current.select();
      }
    });
  }

  function handleTag(e: MouseEvent) {
    e.stopPropagation();

    resetContextMenu();

    dispatch(toggleModal("tagsModal"));
  }

  function handleNewPage(e: MouseEvent, item: ItemState) {
    e.stopPropagation();
    resetContextMenu();

    let referenceId = 0;

    if (folders.selected) {
      referenceId = folders.selected.ID;
    } else if (pages.active && pages.active.FOLDER_ID) {
      referenceId = pages.active.FOLDER_ID;
    }

    dispatch(
      setInputPosition({
        referenceId,
        toggled: true,
        forFolder: false,
      })
    );
  }

  function handleNewFolder(e: MouseEvent) {
    e.stopPropagation();
    resetContextMenu();

    let referenceId = 0;

    if (folders.selected) {
      referenceId = folders.selected.ID;
    } else if (pages.active && pages.active.FOLDER_ID) {
      referenceId = pages.active.FOLDER_ID;
    }

    dispatch(
      setInputPosition({
        referenceId,
        toggled: true,
        forFolder: true,
      })
    );
    if (sidebar.inputPosition.referenceId === null) dispatch(deselectFolder(null));
  }

  async function getData() {
    try {
      dispatch(setSidebarLoading(true));
      const [foldersResponse, pagesResponse] = await Promise.all([
        fetch(`${getApiUrl()}/folders/`, {
          method: "GET",
          credentials: "include",
        }),
        fetch(`${getApiUrl()}/pages/`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      if (foldersResponse.status !== 200) {
        dispatch(setSidebarLoading(false));
        throwResponseStatusError(foldersResponse, "GET");
      }

      if (pagesResponse.status !== 200) {
        dispatch(setSidebarLoading(false));
        throwResponseStatusError(pagesResponse, "GET");
      }

      const [foldersData, pagesData] = await Promise.all([
        foldersResponse.json(),
        pagesResponse.json(),
      ]);

      let formattedFolders = formatFolders(foldersData.folders, folders.list);
      let formattedPages = formatPages(pagesData.pages, formattedFolders);

      dispatch(setFolders(formattedFolders));
      dispatch(setPages(formattedPages));
      dispatch(setSidebarLoading(false));
    } catch (error) {
      console.log(error);
    }
  }

  function resetContextMenu() {
    setContextMenu({
      position: {
        x: 0,
        y: 0,
      },
      toggled: false,
    });
  }

  async function handleAddToFavorites(e: MouseEvent, item: ItemState) {
    try {
      e.stopPropagation();

      const response = await fetch(`${getApiUrl()}/pages/favorite/`, {
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        credentials: "include",
        body: JSON.stringify({
          favoriteStatus: item.IS_FAVORITE ? 0 : 1,
          pageId: item.PAGE_ID,
        }),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was an issue parsing /pages/new response";

      if (item.IS_PAGE)
        dispatch(
          setFavoriteStatus({ favoriteStatus: item.IS_FAVORITE ? 0 : 1, page: item })
        );
      resetContextMenu();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (inputPositionRef.current && sidebar.inputPosition.toggled)
      inputPositionRef?.current.focus();
  }, [sidebar.inputPosition.toggled]);

  useEffect(() => {
    dispatch(setPages(formatPages(pages?.list, folders?.list, pages.list)));
  }, [folders.list]);

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    const inputPositionHandler = (event: MouseEvent) => {
      if (
        inputPositionRef.current &&
        !inputPositionRef.current?.contains(event.target as HTMLElement) &&
        !(event.target as HTMLElement).classList.contains("new-folder-button") &&
        !(event.target as HTMLElement).classList.contains("new-page-button")
      ) {
        dispatch(setNewFolderName(""));
        dispatch(setNewPageName(""));
        resetContextMenu();
        dispatch(
          setInputPosition({
            referenceId: null,
            toggled: false,
            forFolder: false,
          })
        );
      }

      if (
        contextMenu.toggled &&
        !contextMenuRef.current?.contains(event.target as HTMLElement)
      ) {
        dispatch(setNewFolderName(""));
        dispatch(setNewPageName(""));
        resetContextMenu();
      }

      if (
        sidebar.renameInputToggled &&
        !(event.target as HTMLElement).classList.contains("rename-input") &&
        !(event.target as HTMLElement).classList.contains("rename")
      ) {
        dispatch(setRenameInputToggled(false));
        dispatch(setNewNameForRename(""));
      }
    };

    window.addEventListener("click", inputPositionHandler);

    return () => {
      window.removeEventListener("click", inputPositionHandler);
    };
  });

  const sidebarHeaderButtons = [
    {
      symbol: "< >",
      title: "Expand folders",
      disabled: sidebar.dragToggled,
      visible:
        sidebar.view.name === "Notes" &&
        combined.filter((item) => !item.IS_PAGE).length !== 0,
      onClick: () => dispatch(expandFolders(null)),
    },
    {
      symbol: "> <",
      title: "Collapse folders",
      disabled: sidebar.dragToggled,
      visible:
        sidebar.view.name === "Notes" &&
        combined.filter((item) => !item.IS_PAGE).length !== 0,
      onClick: () => dispatch(collapseFolders(null)),
    },
    {
      symbol: "+P",
      title: "Create a new page",
      disabled: false,
      visible: sidebar.view.name === "Notes",
      className: "new-page-button",
      onClick: () => {
        let referenceId = 0;

        if (sidebar.inputPosition.toggled) {
          dispatch(
            setInputPosition({
              ...sidebar.inputPosition,
              referenceId: null,
              toggled: false,
            })
          );
        } else {
          if (folders.selected) {
            referenceId = folders.selected.ID;
          } else if (pages.active && pages.active.FOLDER_ID) {
            referenceId = pages.active.FOLDER_ID;
          }

          dispatch(
            setInputPosition({
              referenceId,
              toggled: true,
              forFolder: false,
            })
          );
        }
      },
    },
    {
      symbol: "+F",
      title: "Create a new folder",
      disabled: false,
      visible: sidebar.view.name === "Notes",
      className: "new-folder-button",
      onClick: () => {
        let referenceId = 0;

        if (sidebar.inputPosition.toggled) {
          dispatch(
            setInputPosition({
              ...sidebar.inputPosition,
              referenceId: null,
              toggled: false,
            })
          );
        } else {
          if (folders.selected) {
            referenceId = folders.selected.ID;
          } else if (pages.active && pages.active.FOLDER_ID) {
            referenceId = pages.active.FOLDER_ID;
          }

          dispatch(
            setInputPosition({
              referenceId,
              toggled: true,
              forFolder: true,
            })
          );
        }

        if (sidebar.inputPosition.referenceId === null) dispatch(deselectFolder(null));
      },
    },
    {
      symbol: "+",
      title: "Create a new tag",
      disabled: sidebar.dragToggled,
      visible: sidebar.view.name === "Tags",
      onClick: () => dispatch(setNewTagFormToggled(!sidebar.newTagFormToggled)),
    },
  ];

  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      style={{ width: `${sidebar.width ? `${sidebar.width}px` : "275px"}` }}
      // onMouseDown={(e) => e.preventDefault()}
    >
      <div className="sidebar-nav">
        {sidebar.viewOptions.map((viewOption, index) => (
          <button
            onClick={() => {
              dispatch(setSidebarView(viewOption));
              if (sidebar.width <= 60) dispatch(setSidebarWidth(275));
            }}
            className={viewOption.id === sidebar.view.id ? "current" : ""}
            key={index}
            title={viewOption.name}
          >
            {viewOption.id === 1 && <PageIcon />}
            {viewOption.id === 2 && <SearchIcon />}
            {viewOption.id === 3 && <TagIcon />}
          </button>
        ))}
        <button
          className="theme-button"
          onClick={() => dispatch(setTheme(theme === "dark" ? "light" : "dark"))}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          className="user-button"
          onClick={() => setUserMenuToggled(!userMenuToggled)}
          title="User options"
        >
          <UserIcon />
        </button>
        {userMenuToggled && <UserMenu setUserMenuToggled={setUserMenuToggled} />}
      </div>
      <div className="sidebar-body">
        <div className="current-view">
          <p>{sidebar.view.name}</p>
        </div>
        {(sidebar.view.name === "Notes" || sidebar.view.name === "Tags") &&
          tags.selected === null &&
          !sidebar.newTagFormToggled && (
            <div className="header">
              <div className="sidebar-header-buttons">
                {sidebarHeaderButtons.map((button, i) => {
                  if (button.visible) {
                    return (
                      <button
                        className={button.className}
                        disabled={button.disabled}
                        onClick={button.onClick}
                        title={button.title}
                        key={i}
                      >
                        {button.symbol}
                      </button>
                    );
                  }
                })}
              </div>
              {sidebar.inputPosition.referenceId === 0 &&
                sidebar.inputPosition.toggled && (
                  <form
                    className="new-folder-form"
                    onSubmit={
                      sidebar.inputPosition.forFolder
                        ? handleNewFolderSubmit
                        : handleNewPageSubmit
                    }
                  >
                    <input
                      ref={inputPositionRef}
                      spellCheck="false"
                      onChange={(e) => {
                        if (sidebar.inputPosition.forFolder) {
                          dispatch(setNewFolderName(e.target.value));
                        } else {
                          dispatch(setNewPageName(e.target.value));
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
          )}
        {sidebar.view.name === "Notes" && (
          <ItemList
            setContextMenu={setContextMenu}
            handleNewFolderSubmit={handleNewFolderSubmit}
            handleNewPageSubmit={handleNewPageSubmit}
            inputPositionRef={inputPositionRef}
            resetContextMenu={resetContextMenu}
            handleRename={handleRename}
            renameInputRef={renameInputRef}
          />
        )}
        {sidebar.view.name === "Search" && <PageSearch />}
        {sidebar.view.name === "Tags" && <TagsSidebarView />}
      </div>
      <div
        className={`drag-sidebar-button ${sidebar.dragToggled ? "active" : ""}`}
        onMouseDown={startResizing}
      ></div>
      <ContextMenu
        item={pages.active || folders.selected} // TODO - figure out how to determine which
        toggled={contextMenu.toggled}
        positionX={contextMenu.position.x}
        positionY={contextMenu.position.y - 15}
        contextMenuRef={contextMenuRef}
        buttons={[
          {
            text: "New Page",
            icon: "📄",
            active: !pages.selected?.IS_FAVORITE && sidebar.shiftClickItems.end === null,
            onClick: handleNewPage,
            isSpacer: false,
          },
          {
            text: "New Folder",
            icon: "📁",
            active: !pages.selected?.IS_FAVORITE && sidebar.shiftClickItems.end === null,
            onClick: handleNewFolder,
            isSpacer: false,
          },
          {
            text: "",
            icon: "",
            onClick: () => null,
            active:
              !pages.selected?.IS_FAVORITE &&
              sidebar.shiftClickItems.end === null &&
              sidebar.inputPosition.referenceId !== 0,
            isSpacer: true,
          },
          // {
          //   text: "Add Tags",
          //   icon: "#️⃣",
          //   active:
          //     sidebar.shiftClickItems.end === null &&
          //     sidebar.inputPosition.referenceId !== 0,
          //   onClick: handleTag,
          //   isSpacer: false,
          // },
          {
            text: "Add To Favorites",
            icon: "⭐️",
            active:
              !pages.active?.IS_FAVORITE &&
              sidebar.shiftClickItems.end === null &&
              sidebar.inputPosition.referenceId !== 0,
            onClick: handleAddToFavorites,
            isSpacer: false,
          },
          {
            text: "Remove From Favorites",
            icon: "⭐️",
            active:
              (pages.active?.IS_FAVORITE &&
                sidebar.shiftClickItems.end === null &&
                sidebar.inputPosition.referenceId !== 0) ||
              false,
            onClick: handleAddToFavorites,
            isSpacer: false,
          },
          {
            text: "",
            icon: "",
            onClick: () => null,
            active:
              sidebar.shiftClickItems.end === null &&
              sidebar.inputPosition.referenceId !== 0,
            isSpacer: true,
          },
          {
            text: "Rename",
            icon: "ABC",
            active:
              sidebar.shiftClickItems.end === null &&
              sidebar.inputPosition.referenceId !== 0,
            onClick: handleRename,
            isSpacer: false,
          },
          {
            text: "Delete",
            icon: "🗑️",
            active: sidebar.inputPosition.referenceId !== 0,
            onClick: sidebar.shiftClickItems.end
              ? handleDeleteMultiple
              : handleDeleteSingle,
            isSpacer: false,
          },
        ]}
      />
    </aside>
  );
}

export default Sidebar;
