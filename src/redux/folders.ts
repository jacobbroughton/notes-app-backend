import { createSlice, current } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { FolderState, FoldersState, TagState } from "../types";

const initialState: FoldersState = {
  list: [],
  selected: null,
  stagedToDelete: null,
  active: null,
};

const foldersSlice = createSlice({
  name: "folders",
  initialState,
  reducers: {
    resetFoldersState: () => {
      return initialState;
    },
    setFolders: (state, { payload }: PayloadAction<Array<FolderState>>) => {
      const folders = payload.map((folder: FolderState) => {
        return {
          ...folder,
          IS_PAGE: false,
        };
      });

      return {
        ...state,
        list: folders,
        selected: folders.find((folder: FolderState) => folder.SELECTED) || null,
      };
    },
    setExpandedStatus: (state, { payload }) => {
      const expandedFolder = payload;
      const folders = [...state?.list];

      let idsToUpdateVisibility: Array<number> = [];
      console.log(idsToUpdateVisibility);

      function checkForChildren(folderToCheck: FolderState) {
        for (let i = 0; i < folders.length; i++) {
          if (folders[i].PARENT_FOLDER_ID === folderToCheck.ID) {
            idsToUpdateVisibility.push(folders[i].ID);

            let hasChildren = folders.filter(
              (folder: FolderState) => folder.PARENT_FOLDER_ID === folders[i].ID
            );

            if (hasChildren && folders[i].EXPANDED_STATUS) checkForChildren(folders[i]);
          }
        }
      }

      checkForChildren(expandedFolder);

      return {
        ...state,
        list: folders.map((folder: FolderState) => {
          return {
            ...folder,
            SELECTED: folder.ID === expandedFolder.ID,
            ...(folder.ID === expandedFolder.ID && {
              EXPANDED_STATUS: !folder.EXPANDED_STATUS,
            }),
            ...(idsToUpdateVisibility.includes(folder.ID) && {
              VISIBLE: !expandedFolder.EXPANDED_STATUS,
            }),
          };
        }),
      };
    },
    collapseFolders: (state, { payload }) => {
      return {
        ...state,
        list: state.list?.map((folder: FolderState) => ({
          ...folder,
          EXPANDED_STATUS: false,
          VISIBLE: folder.PARENT_FOLDER_ID ? false : true,
        })),
      };
    },
    expandFolders: (state, { payload }) => {
      return {
        ...state,
        list: state.list?.map((folder: FolderState) => ({
          ...folder,
          EXPANDED_STATUS: true,
          VISIBLE: true,
        })),
      };
    },
    selectFolder: (state, { payload }) => {
      const selectedFolder =
        payload === null
          ? null
          : state.list.find((folder: FolderState) => folder.ID === payload.ID);

      return {
        ...state,
        list: state.list.map((folder: FolderState) => {
          let SELECTED = false;

          if (
            (payload === null && folder?.SELECTED) ||
            payload?.ID == selectedFolder?.ID
          ) {
            SELECTED = false;
          }

          if (folder?.ID === selectedFolder?.ID) {
            SELECTED = true;
          }

          return {
            ...folder,
            SELECTED,
          };
        }),
        selected: selectedFolder || null,
      };
    },
    deselectFolder: (state, { payload }: PayloadAction<null>) => {
      return {
        ...state,
        list: state.list.map((folder: FolderState) => {
          return {
            ...folder,
            ...(folder.SELECTED && { SELECTED: false }),
          };
        }),
      };
    },
    setFolderEffStatus: (state, { payload: folderId }: PayloadAction<number>) => {
      return {
        ...state,
        list: state.list.map((folder: FolderState) => {
          return {
            ...folder,
            ...(folder.ID === folderId && { EFF_STATUS: 0, SELECTED: false }),
          };
        }),
        selected: null,
      };
    },
    setStagedFolderToDelete: (state, { payload }: PayloadAction<FolderState | null>) => {
      return {
        ...state,
        stagedToDelete: payload,
      };
    },
    renameFolder: (state, { payload }) => {
      return {
        ...state,
        list: state.list.map((folder: FolderState) => {
          return {
            ...folder,
            ...(folder.ID === payload.folderId && {
              NAME: payload.newName,
            }),
          };
        }),
      };
    },
    addTagToFolder: (state, { payload }): FoldersState => {
      const { item, tag } = payload;

      let childFolderIds: Array<number> = [];

      function getChildren(folderIdToCheck: number) {
        childFolderIds.push(folderIdToCheck);

        const children = current(state)
          .list.filter(
            (folder: FolderState) => folder.PARENT_FOLDER_ID === folderIdToCheck
          )
          .map((folder: FolderState) => folder.ID);

        if (children.length === 0) return;

        children.forEach((folderId) => getChildren(folderId));
      }

      getChildren(item.ID);

      let selectedFolderTags: Array<number> = [];

      if (state.selected) {
        selectedFolderTags = [...state.selected.TAGS];
        if (state.selected.ID === item.ID && !state.selected.TAGS.includes(tag.ID)) {
          selectedFolderTags = [...selectedFolderTags, tag.ID];
          selectedFolderTags.sort((a, b) => (a > b ? 1 : -1));
        }
      }

      return {
        ...state,
        list: state.list.map((folder: FolderState) => {
          const isSameFolder = folder.ID === item.ID;

          let TAGS = [...folder.TAGS, tag.ID];
          TAGS.sort((a, b) => (a > b ? 1 : -1));

          return {
            ...folder,
            ...((isSameFolder || childFolderIds.includes(folder.ID)) &&
              !folder.TAGS.includes(tag.ID) && {
                TAGS,
              }),
          };
        }),
        selected: {
          ...state.selected,
          TAGS: selectedFolderTags,
        } as FolderState | null | null,
      };
    },
    removeTagFromFolder: (state, { payload }): FoldersState => {
      const { item, tag } = payload;

      const removeTag = (folder: FolderState | null, tagId: number) => {
        if (!folder) return [];
        return folder.TAGS.filter((innerTag) => innerTag !== tagId);
      };

      let childFolderIds: Array<number> = [];

      function getChildren(folderIdToCheck: number) {
        childFolderIds.push(folderIdToCheck);

        const children = current(state)
          .list.filter(
            (folder: FolderState) => folder.PARENT_FOLDER_ID === folderIdToCheck
          )
          .map((folder: FolderState) => folder.ID);

        if (children.length === 0) return;

        children.forEach((folderId) => getChildren(folderId));
      }

      getChildren(item.ID);

      return {
        ...state,
        list: state.list.map((folder: FolderState) => {
          return {
            ...folder,
            ...(folder.ID === item.ID && {
              TAGS: removeTag(folder, tag.ID),
            }),
            ...(childFolderIds.includes(folder.ID) && {
              TAGS: removeTag(folder, tag.ID),
            }),
          };
        }),
        active: {
          ...state.active,
          ...(state.active?.ID === item.ID && {
            TAGS: removeTag(state.active, tag.ID),
          }),
        } as FolderState | null,
        selected: {
          ...state.selected,
          ...(state.selected?.ID === item.ID && {
            TAGS: removeTag(state.selected, tag.ID),
          }),
        } as FolderState | null,
      };
    },
  },
});

export const {
  resetFoldersState,
  setFolders,
  setExpandedStatus,
  collapseFolders,
  expandFolders,
  selectFolder,
  deselectFolder,
  setFolderEffStatus,
  setStagedFolderToDelete,
  renameFolder,
  addTagToFolder,
  removeTagFromFolder,
} = foldersSlice.actions;
export const foldersReducer = foldersSlice.reducer;
