import { createSlice } from "@reduxjs/toolkit";
import { TagState, TagsState } from "../types";


const initialState: TagsState = {
  list: [],
  selected: null,
  colorOptions: {
    default: [],
    userCreated: [],
  },
};

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    resetTagsState: () => {
      return initialState
    },
    setTags: (state, { payload }) => {
      return {
        ...state,
        list: payload.map((tag: TagState) => {
          return {
            ...tag,
            SELECTED: false,
          };
        }),
      };
    },
    selectTag: (state, { payload }) => {
      return {
        ...state,
        list: state.list.map((tag) => {
          return {
            ...tag,
            ...(tag.ID === payload.ID && { SELECTED: true }),
            ...(tag.ID !== payload.ID && tag.SELECTED && { SELECTED: false }),
          };
        }),
        selected: payload,
      };
    },
    deselectTag: (state) => {
      return {
        ...state,
        list: state.list.map((tag) => {
          return {
            ...tag,
            ...(tag.SELECTED && { SELECTED: false }),
          };
        }),
        selected: null,
      };
    },
    editTag: (state, { payload }) => {
      return {
        ...state,
        list: state.list.map((tag) => {
          return {
            ...tag,
            ...(tag.ID === payload.id && {
              COLOR_CODE: payload.color.COLOR_CODE,
              COLOR_ID: payload.color.ID,
              NAME: payload.name,
            }),
          };
        }),
      };
    },
    deleteTag: (state, { payload }) => {
      return {
        ...state,
        list: state.list.filter((tag) => {
          return tag.ID !== payload.id;
        }),
      };
    },
    addTag: (state, { payload }) => {
      return {
        ...state,
        list: [...state.list, payload],
      };
    },
    setColorOptions: (state, { payload }) => {
      return {
        ...state,
        colorOptions: {
          default: payload.defaultOptions,
          userCreated: payload.userCreatedOptions,
        },
      };
    },
    addCustomColorOption: (state, { payload }) => {
      if (!payload) return state;
      return {
        ...state,
        colorOptions: {
          ...state.colorOptions,
          userCreated: [...state.colorOptions.userCreated, payload],
        },
      };
    },
  },
});

export default tagsSlice.reducer;
export const {
  resetTagsState,
  setTags,
  selectTag,
  deselectTag,
  editTag,
  deleteTag,
  addTag,
  setColorOptions,
  addCustomColorOption,
} = tagsSlice.actions;
