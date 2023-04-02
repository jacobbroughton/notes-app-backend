import { FolderState, PageState } from "../types";

/**
 * @param {array} updatedFolders Folders that were most recently updated,
 * @param {array} existingFolders Folders from state,
 * @param {array} existingPages Pages from state,
 */
export const formatFolders = (
  updatedFolders: Array<FolderState> = [],
  existingFolders: Array<FolderState> = []
) => {
  return updatedFolders?.map((folder: FolderState) => {
    let existingFolderThatMatches = existingFolders?.find(
      (innerFolder) => innerFolder.ID === folder.ID
    );

    let existingIdArray: Array<number> = [];
    let newFolder: FolderState | undefined;
    let parentOfNewFolder = null;

    if (existingFolders.length !== 0) {
      existingIdArray = existingFolders.map((innerFolder) => innerFolder.ID);
      newFolder = updatedFolders.find(
        (innerFolder) => !existingIdArray.includes(innerFolder.ID)
      );
      parentOfNewFolder = existingFolders.find(
        (innerFolder) => innerFolder.ID === newFolder?.PARENT_FOLDER_ID
      );
    }

    let EXPANDED_STATUS = existingFolderThatMatches?.EXPANDED_STATUS || false;

    let VISIBLE = existingFolderThatMatches ? existingFolderThatMatches.VISIBLE : false;

    const TAGS = folder.TAGS.sort((a: number, b: number) => (a > b ? 1 : -1));

    if (folder.EFF_STATUS) {
      if (existingFolders.length === 0) {
        if (existingFolderThatMatches?.VISIBLE || !folder.PARENT_FOLDER_ID) {
          VISIBLE = true;
        }
      } else if (
        (newFolder?.PARENT_FOLDER_ID === null && folder.ID === newFolder.ID) ||
        (parentOfNewFolder?.EXPANDED_STATUS &&
          folder.PARENT_FOLDER_ID === parentOfNewFolder.ID)
      ) {
        VISIBLE = true;
      }
    }
    return {
      ...folder,
      EXPANDED_STATUS,
      VISIBLE,
      SELECTED: folder.SELECTED ? folder.SELECTED : false,
      TAGS,
    };
  });
};

export const formatPages = (
  pages: Array<PageState> = [],
  formattedFolders: Array<FolderState> = [],
  existingPages: Array<PageState> = []
) => {
  return pages?.map((page: PageState) => {
    let pageFolder = formattedFolders.find((folder) => folder.ID === page.FOLDER_ID);

    let VISIBLE = false;

    if (pageFolder) {
      if (pageFolder.VISIBLE && pageFolder.EXPANDED_STATUS) {
        VISIBLE = true;
      }
    }

    if (page.FOLDER_ID === null) VISIBLE = true;

    const existingPage = existingPages.find(
      (existingPage) => existingPage.PAGE_ID === page.PAGE_ID
    );

    return {
      ...page,
      IS_PAGE: true,
      TIER: pageFolder ? pageFolder.TIER + 1 : 1,
      VISIBLE,
      SELECTED: page.SELECTED ? page.SELECTED : false,
      DRAFT_TITLE:
        existingPage?.DRAFT_TITLE !== page.TITLE ? page.DRAFT_TITLE : page.TITLE,
      DRAFT_NAME: existingPage?.DRAFT_NAME !== page.NAME ? page.DRAFT_NAME : page.NAME,
      DRAFT_BODY: existingPage?.DRAFT_BODY !== page.BODY ? page.DRAFT_BODY : page.BODY,
      OPEN: existingPage?.OPEN ? true : false,
    };
  });
};
