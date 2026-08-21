import { Moon, Sun } from '@gravity-ui/icons';
import { Button, Icon } from '@gravity-ui/uikit';

import { useAppDispatch } from '../../hooks';
import useLocalStorage from '../../hooks/use-local-storage';
import { THEME_KEY, useTheme } from '../../hooks/use-theme';
import { setTheme } from '../../store';

export default function ThemeButton() {
  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  const [, setStoredTheme] = useLocalStorage(THEME_KEY, isDark ? 'dark' : 'light');

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setStoredTheme(newIsDark ? 'dark' : 'light');
    dispatch(setTheme({ isDark: newIsDark }));
  };

  return (
    <Button
      view="flat"
      size="m"
      aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      onClick={toggleTheme}
    >
      <Icon data={isDark ? Sun : Moon} size={16} />
    </Button>
  );
}
