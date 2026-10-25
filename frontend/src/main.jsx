/**
 * @file main.jsx
 * @description Punto de entrada principal de la aplicación Alejandría UPC.
 *
 * Orden de wrappers:
 *   StrictMode → ThemeProvider (MUI tema oscuro) → CssBaseline (reset global) → App
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// MUI
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Tema personalizado Alejandría UPC
import theme from './theme/theme.js';

// Estilos globales + tokens CSS
import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/*
        CssBaseline aplica:
        - Fondo global #0B1220
        - Reset de márgenes
        - Tipografía Inter
        - Suavizado de fuentes
        - Respeto a prefers-reduced-motion (definido en el tema)
      */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
