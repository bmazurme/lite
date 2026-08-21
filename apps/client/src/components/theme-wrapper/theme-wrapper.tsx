import { ThemeProvider, type Theme } from '@gravity-ui/uikit';
import type { ReactNode } from 'react';

import { useTheme } from '../../hooks/use-theme';

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { isDark } = useTheme();
  const theme: Theme = isDark ? 'dark' : 'light';

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
