/**
 * @file themeContext.js
 * @description Theme mode context and access hook (FE-28).
 *
 * Separated from provider to adhere to React Fast Refresh boundaries.
 */

import { createContext, useContext } from 'react';

/**
 * @typedef {object} ThemeModeValue
 * @property {'dark'|'light'} mode
 * @property {() => void} toggleThemeMode
 * @property {(mode: 'dark'|'light') => void} setThemeMode
 */

/** @type {import('react').Context<ThemeModeValue|null>} */
export const ThemeModeContext = createContext(null);

/**
 * Access the current theme mode and toggle function.
 * @returns {ThemeModeValue}
 */
export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a <ThemeModeProvider>.');
  }
  return context;
}
