import type { RootState } from '../store';

import { useAppSelector } from '.';

export const THEME_KEY = 'theme';

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const item = window.localStorage.getItem(THEME_KEY);
    const value = item ? JSON.parse(item) : 'dark';

    return value === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const useTheme = (): { isDark: boolean } => {
  const isDark = useAppSelector((state: RootState) => state.theme.isDark);

  return { isDark };
};
