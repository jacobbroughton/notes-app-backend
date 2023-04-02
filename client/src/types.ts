export type FolderState = {
  ID: number;
  PARENT_FOLDER_ID: number | null;
  NAME: string;
  EFF_STATUS: number;
  TAGS: Array<number>;
  TIER: number;
  ORDER: number;
  VISIBLE: boolean;
  SELECTED: boolean;
  IS_PAGE: boolean;
  EXPANDED_STATUS: boolean;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string | null;
  CREATED_BY_ID: number;
  MODIFIED_BY_ID: number | null;
};

export type TagState = {
  ID: number;
  NAME: string;
  COLOR_ID: number;
  HAS_DEFAULT_COLOR: boolean;
  EFF_STATUS: number;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string | null;
  CREATED_BY_ID: number;
  MODIFIED_BY_ID: number | null;
  COLOR_CODE: string;
  SELECTED: boolean;
};

export type UntitledPageState = {
  NAME: string;
  BODY: string;
  IS_UNTITLED: boolean;
  IS_INITIAL: boolean;
};

export type PageState = {
  ID: number | null;
  PAGE_ID: number;
  FOLDER_ID: number | null;
  NAME: string;
  TITLE: string;
  BODY: string;
  IS_FAVORITE: boolean;
  EFF_STATUS: number;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string | null;
  CREATED_BY_ID: number;
  MODIFIED_BY_ID: number | null;
  TAGS: Array<number>;
  IS_PAGE: boolean;
  TIER: number;
  VISIBLE: boolean;
  SELECTED: boolean;
  DRAFT_TITLE: string;
  DRAFT_NAME: string;
  DRAFT_BODY: string;
  OPEN: boolean;
  ACTIVE: boolean;
  IS_MODIFIED: boolean;
  IS_UNTITLED: boolean;
};

export type FoldersState = {
  list: Array<FolderState>;
  selected: FolderState | null;
  stagedToDelete: FolderState | null;
  active: FolderState | null;
};

export type PagesState = {
  list: Array<PageState> | [];
  selected: PageState | null;
  active: PageState | null;
  stagedToSwitch: PageState | null;
  stagedToDelete: PageState | null;
  untitledPage: {
    NAME: string;
    BODY: string;
    IS_UNTITLED: boolean;
    IS_INITIAL: boolean;
  };
};

export type TagsState = {
  list: Array<TagState>;
  selected: TagState | null;
  colorOptions: {
    default: Array<ColorState>;
    userCreated: Array<ColorState>;
  };
};

export type SidebarItemState = {
  ID: number | null;
  PAGE_ID: number | null;
  PARENT_FOLDER_ID: number | null;
  NAME: string;
  EFF_STATUS: number;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string | null;
  CREATED_BY_ID: number;
  MODIFIED_BY_ID: number | null;
  TAGS: Array<number>;
  TIER: number;
  ORDER: number;
  VISIBLE: boolean;
  SELECTED: boolean;
  IS_PAGE: boolean;
};

export type ModalsState = {
  unsavedWarning: boolean;
  deleteModal: boolean;
  tagsModal: boolean;
};

export type UserState = {
  ID: number;
  USERNAME: string;
  ADMIN: boolean;
  HASH: string;
  SALT: string;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string | null;
};

export type ColorState = {
  ID: number;
  COLOR_CODE: string;
  EFF_STATUS: number;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string;
  IS_DEFAULT_COLOR: number;
};

export type ColorPickerState = {
  toggled: boolean;
};

export type ContextMenuButton = {
  text: string;
  icon: string;
  onClick: Function;
  active: boolean;
  isSpacer: boolean;
};

export type ItemState = {
  ID: number | null;
  PAGE_ID: number | null;
  FOLDER_ID: number | null;
  NAME: string;
  TITLE: string | null;
  BODY: string | null;
  IS_FAVORITE: boolean;
  EFF_STATUS: number;
  CREATED_DTTM: string;
  MODIFIED_DTTM: string | null;
  CREATED_BY_ID: number;
  MODIFIED_BY_ID: number | null;
  IS_MODIFIED: boolean | null;
  EXPANDED_STATUS: boolean;
  TAGS: Array<number>;
  IS_PAGE: boolean;
  TIER: number;
  VISIBLE: boolean;
  SELECTED: boolean;
  DRAFT_TITLE: string | null;
  DRAFT_NAME: string | null;
  DRAFT_BODY: string;
  OPEN: boolean;
  ACTIVE: boolean;
  ORDER: number;
  PARENT_FOLDER_ID: number | null;
};

export type SidebarState = {
  width: number;
  view: {
    id: number;
    name: string;
  };
  viewOptions: Array<{
    id: number;
    name: string;
  }>;
  searchValue: string;
  shiftClickItems: {
    start: number | null;
    end: number | null;
    list: Array<SidebarItemState>;
  };
  newTagFormToggled: boolean;
  dragToggled: boolean;
  draggedOverItem: {
    ID: number;
    PAGE_ID: number | undefined;
  } | null;
  grabbedItem: ItemState | null;
  inputPosition: {
    referenceId: number | null;
    toggled: boolean;
    forFolder: boolean;
  };
  renameInputToggled: boolean;
  newNameForRename: string;
  newPageName: string;
  newFolderName: string;
  loading: boolean
};
