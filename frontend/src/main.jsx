/**
 * @file main.jsx
 * @description Main entry point of the Alejandría UPC application.
 *
 * Wrapper order:
 *   StrictMode → ThemeModeProvider (Dynamic dark/light theme + CssBaseline) → App
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import ThemeModeProvider from './context/ThemeModeProvider.jsx';

// Global styles + CSS tokens
import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>
  </StrictMode>
);
