import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { ModalsState } from "../types";

const initialState: ModalsState = {
  unsavedWarning: false,
  deleteModal: false,
  tagsModal: false,
};

const modalsSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    resetModalsState: () => {
      return initialState;
    },
    toggleModal: (state, { payload }: PayloadAction<keyof ModalsState>) => {
      if (!["unsavedWarning", "deleteModal", "tagsModal"].includes(payload)) return state;

      return {
        ...state,
        [payload]: !state[`${payload}`],
      };
    },
  },
});

export default modalsSlice.reducer;
export const { resetModalsState, toggleModal } = modalsSlice.actions;
