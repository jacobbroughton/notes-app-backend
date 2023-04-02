import { createSlice } from "@reduxjs/toolkit";

type ThemeState = string;

const initialState: ThemeState = localStorage.getItem("theme") || "light";

const theme = createSlice({
  name: "theme",
  initialState,
  reducers: {
    resetThemeState: () => {
      return initialState;
    },
    setTheme: (state, { payload }) => {
      return payload;
    },
  },
});

export const { resetThemeState, setTheme } = theme.actions;

export default theme.reducer;
