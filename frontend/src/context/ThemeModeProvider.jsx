/**
 * @file ThemeModeProvider.jsx
 * @description Theme provider supporting dark and light mode with localStorage persistence (FE-28).
 */

import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { ThemeModeContext } from './themeContext.js';
import { getAppTheme } from '../theme/theme.js';

const STORAGE_KEY = 'alejandria_theme_mode';

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export default function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore localStorage errors in sandboxed environments
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleThemeMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setMode(newMode);
    }
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleThemeMode,
      setThemeMode,
    }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
