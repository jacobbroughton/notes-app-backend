import { createSlice } from "@reduxjs/toolkit";
import { UserState } from "../types";

const initialState = null as UserState | null;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserState: () => {
      return initialState;
    },
    setUser: (state, { payload }) => {
      if (!payload) return null;
      return {
        ...payload,
      };
    },
  },
});

export const { resetUserState, setUser } = userSlice.actions;
export default userSlice.reducer;
