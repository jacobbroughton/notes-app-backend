import { createSlice } from "@reduxjs/toolkit";
import { ItemState } from "../types";

type CombinedState = Array<ItemState>;

const initialState: CombinedState = [];

const combinedSlice = createSlice({
  name: "combined",
  initialState,
  reducers: {
    resetCombinedState: () => {
      return initialState;
    },
    setCombined: (state, { payload }) => {
      return payload;
    },
  },
});

export default combinedSlice.reducer;
export const { resetCombinedState, setCombined } = combinedSlice.actions;
