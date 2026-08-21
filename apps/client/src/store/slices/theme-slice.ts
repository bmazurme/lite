import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';
import { getStoredTheme } from '../../hooks/use-theme';

export interface ThemeState {
  isDark: boolean;
}

export const initialStateTheme: ThemeState = {
  isDark: getStoredTheme() === 'dark',
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
