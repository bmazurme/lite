import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';

export interface ThemeState {
  isDark: boolean;
}

export const initialStateTheme: ThemeState = {
  isDark: true,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: initialStateTheme,
  reducers: {
    setTheme: (state, action) => {
      state.isDark = action.payload.isDark;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
export const themeSelector = (state: RootState) => state.theme;
