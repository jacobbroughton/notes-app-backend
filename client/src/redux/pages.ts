import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PagesState, PageState, FolderState, TagState } from "../types";
import { emptyEditorState } from "../utils/editorUtils";

const initialState: PagesState = {
  list: [],
  selected: null,
  active: null,
  stagedToSwitch: null,
  stagedToDelete: null,
  untitledPage: {
    NAME: "",
    BODY: emptyEditorState,
    IS_UNTITLED: true,
    IS_INITIAL: true,
  },
};

const pagesSlice = createSlice({
  name: "pages",
  initialState,
  reducers: {
    resetPagesState: () => {
      return initialState;
    },
    setPages: (state, { payload }) => {
      const pages: Array<PageState> = payload.map((page: PageState) => {
        const existingPage = state.list?.find(
          (innerPage) => innerPage.PAGE_ID === page.PAGE_ID
        );

        return {
          ...page,
          IS_PAGE: true,
          SELECTED: page.SELECTED,
          DRAFT_TITLE: existingPage?.DRAFT_TITLE || page.TITLE,
          DRAFT_NAME: existingPage?.DRAFT_NAME || page.NAME,
          DRAFT_BODY: existingPage?.DRAFT_BODY || page.BODY,
          OPEN: page.OPEN || false,
          ACTIVE: page.ACTIVE || false,
          IS_FAVORITE: page.IS_FAVORITE || false,
        };
      });

      return {
        ...state,
        list: pages,
        selected: state.list.find((page) => page.SELECTED) || null,
      };
    },
    setPageEffStatus: (state, { payload: pageId }: PayloadAction<number>) => {
      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === pageId && {
              EFF_STATUS: 0,
              SELECTED: false,
              OPEN: false,
            }),
          };
        }),
        selected: null,
        active: null,
      };
    },
    selectPage: (state, { payload }: PayloadAction<PageState | null>) => {
      let selectedPage: PageState | null = null;

      const matchingPage = state.list.find((page) => page.PAGE_ID === payload?.PAGE_ID);

      if (matchingPage) selectedPage = matchingPage;

      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...((payload === null || page.PAGE_ID !== payload?.PAGE_ID) &&
              page.SELECTED && { SELECTED: false }),
            ...(page.PAGE_ID === selectedPage?.PAGE_ID && { SELECTED: true }),
            ...(page.PAGE_ID === selectedPage?.PAGE_ID
              ? { ACTIVE: true, OPEN: true }
              : { ACTIVE: false }),
          };
        }),
        selected: selectedPage || null,
        active: selectedPage || state.active,
      };
    },
    deselectPage: (state, { payload }) => {
      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === payload.PAGE_ID && { ACTIVE: false, SELECTED: false }),
          };
        }),
        selected: null,
        active: null,
      };
    },
    updatePage: (state, { payload }) => {
      if (!payload) return state;
      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(payload.PAGE_ID === page.PAGE_ID && {
              ...payload,
            }),
          };
        }),
        active: {
          ...state.active,
          ...payload,
        },
      };
    },
    setPageModified: (state, { payload }: PayloadAction<boolean>) => {
      return {
        ...state,
        active: {
          ...state.active,
          IS_MODIFIED: payload,
        } as PageState | null,
      };
    },
    setPageStagedForSwitch: (state, { payload }: PayloadAction<PageState | null>) => {
      return {
        ...state,
        stagedToSwitch: payload,
      };
    },
    updateParentFolderId: (state, { payload }): PagesState => {
      const { folders, affectedPage, droppedOntoItem } = payload;

      let folderOfDroppedOnItem = null;

      if (droppedOntoItem.IS_PAGE) {
        folderOfDroppedOnItem = folders.find(
          (folder: FolderState) => folder.ID === droppedOntoItem.FOLDER_ID
        );
      }

      return {
        ...state,
        list: state.list.map((page) => {
          let FOLDER_ID;
          let TIER;
          let VISIBLE;

          if (droppedOntoItem.IS_PAGE) {
            FOLDER_ID = droppedOntoItem.FOLDER_ID;
            TIER = droppedOntoItem.TIER;
            VISIBLE = droppedOntoItem.VISIBLE;
          }

          if (!droppedOntoItem.IS_PAGE) {
            FOLDER_ID = droppedOntoItem.ID;
            TIER = droppedOntoItem.TIER + 1;
            VISIBLE = droppedOntoItem.EXPANDED_STATUS;
          }

          return {
            ...page,
            ...(page.PAGE_ID === affectedPage.PAGE_ID && {
              FOLDER_ID,
              TIER,
              VISIBLE,
            }),
          };
        }),
        selected: state.selected,
        active: state.active,
        stagedToSwitch: state.stagedToSwitch,
      };
    },
    setStagedPageToDelete: (state, { payload }): PagesState => {
      return {
        ...state,
        stagedToDelete: payload,
      };
    },
    renamePage: (state, { payload }): PagesState => {
      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === payload.pageId && {
              NAME: payload.newName,
              DRAFT_NAME: payload.newName,
            }),
          };
        }),
        active: {
          ...state.active,
          NAME: payload.newName,
          DRAFT_NAME: payload.newName,
        },
        selected: {
          ...state.active,
          NAME: payload.newName,
          DRAFT_NAME: payload.newName,
        },
      } as PagesState;
    },
    addTagToPage: (state, { payload }): PagesState => {
      const { item, tag } = payload;

      let updatedTags = [...item.TAGS, tag.ID];
      updatedTags.sort((a, b) => (a > b ? 1 : -1));

      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === item.PAGE_ID &&
              !page.TAGS.includes(tag.ID) && {
                TAGS: updatedTags,
              }),
          };
        }),
        ...(state.selected && {
          selected: {
            ...state.selected,
            ...(!state.selected.TAGS.includes(tag.ID) && {
              TAGS: updatedTags,
            }),
          },
        }),
        ...(state.selected && {
          active: {
            ...state.selected,
            ...(!state.selected.TAGS.includes(tag.ID) && {
              TAGS: updatedTags,
            }),
          },
        }),
      };
    },
    removeTagFromPage: (state, { payload }): PagesState => {
      const { item, tag } = payload;

      const removeTag = (page: PageState, tag: TagState) =>
        page.TAGS.filter((innerTag) => innerTag !== tag.ID);

      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === item.PAGE_ID && {
              TAGS: removeTag(page, tag),
            }),
          };
        }),
        ...(state.active && {
          active: {
            ...state.active,
            ...(state.active.PAGE_ID === item.PAGE_ID && {
              TAGS: removeTag(state.active, tag),
            }),
          },
        }),
        ...(state.selected && {
          selected: {
            ...state.selected,
            ...(state.selected.PAGE_ID === item.PAGE_ID && {
              TAGS: removeTag(state.selected, tag),
            }),
          },
        }),
      };
    },
    setPageClosed: (state, { payload }: { payload: PageState | null }): PagesState => {
      const updatedPages = state.list.map((page) => {
        return {
          ...page,
          ...(page.PAGE_ID === payload?.PAGE_ID && { OPEN: false, SELECTED: false }),
        };
      });

      const openPages = updatedPages.filter((page) => page.OPEN === true);

      return {
        ...state,
        list: updatedPages.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === openPages[0]?.PAGE_ID && {
              SELECTED: true,
              ACTIVE: true,
            }),
          };
        }),
        active: openPages[0] || null,
        selected: openPages[0] || null,
      };
    },
    setCursorPosition: (state, { payload }) => {
      return state;
    },
    setPageDraftTitle: (state, { payload }): PagesState => {
      const { page: affectedPage, draftTitle } = payload;

      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === affectedPage.PAGE_ID && { DRAFT_NAME: draftTitle }),
          };
        }),
        active: {
          ...state.active,
          DRAFT_NAME: draftTitle,
        },
      } as PagesState;
    },
    setPageDraftBody: (state, { payload }): PagesState => {
      const { page: affectedPage, draftBody } = payload;

      return {
        ...state,
        list: state.list.map((page) => {
          return {
            ...page,
            ...(page.PAGE_ID === affectedPage.PAGE_ID && { DRAFT_BODY: draftBody }),
          };
        }),
        active: {
          ...state.active,
          DRAFT_BODY: draftBody,
        },
      } as PagesState;
    },
    setUntitledPageBody: (state, { payload }): PagesState => {
      return {
        ...state,
        untitledPage: {
          ...state.untitledPage,
          BODY: payload,
          IS_INITIAL: false,
        },
      };
    },
    setUntitledPageTitle: (state, { payload }): PagesState => {
      return {
        ...state,
        untitledPage: {
          ...state.untitledPage,
          NAME: payload,
          // IS_INITIAL: false,
        },
      };
    },
    resetUntitledPage: (state, { payload }) => {
      return {
        ...state,
        untitledPage: {
          ...state.untitledPage,
          NAME: "",
          BODY: emptyEditorState,
          IS_INITIAL: true,
        },
      };
    },
    setFavoriteStatus: (state, { payload }): PagesState => {
      const { favoriteStatus, page } = payload;

      return {
        ...state,
        list: state.list.map((innerPage) => {
          return {
            ...innerPage,
            ...(innerPage.PAGE_ID === page.PAGE_ID && { IS_FAVORITE: favoriteStatus }),
          };
        }),
      };
    },
  },
});

export const {
  resetPagesState,
  setPages,
  setPageEffStatus,
  selectPage,
  deselectPage,
  updatePage,
  setPageModified,
  setPageStagedForSwitch,
  updateParentFolderId,
  setStagedPageToDelete,
  renamePage,
  addTagToPage,
  removeTagFromPage,
  setPageClosed,
  setPageDraftTitle,
  setPageDraftBody,
  setUntitledPageBody,
  setUntitledPageTitle,
  resetUntitledPage,
  setFavoriteStatus,
  setCursorPosition,
} = pagesSlice.actions;
export const pagesReducer = pagesSlice.reducer;
