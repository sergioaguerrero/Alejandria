/**
 * @file main.jsx
 * @description Main entry point of the Alejandría UPC application.
 *
 * Wrapper order:
 *   StrictMode → ThemeProvider (MUI dark theme) → CssBaseline (global reset) → App
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// MUI
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Alejandría UPC custom theme
import theme from './theme/theme.js';

// Global styles + CSS tokens
import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/*
        CssBaseline applies:
        - Global background #0B1220
        - Margin reset
        - Inter typography
        - Font smoothing
        - Respect for prefers-reduced-motion (defined in the theme)
      */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
