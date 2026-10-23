/**
 * @file AppLayout.jsx
 * @description Estructura de todas las vistas con sesión iniciada (FE-03).
 *
 * Barra superior fija + menú lateral:
 *   - Escritorio: menú fijo visible.
 *   - Móvil y tablet: menú tipo cajón que se abre con el botón de hamburguesa.
 *
 * Las vistas se renderizan en el <Outlet />. El menú crece a medida que se
 * implementan las vistas: por ahora solo Inicio (FE-10).
 */

import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuIcon from '@mui/icons-material/Menu';

import { useAuth } from '../../context/authContext.js';
import { iniciales } from '../../utils/usuarios.js';

const ANCHO_MENU = 248;

/**
 * Enlaces del menú lateral.
 * Cada vista nueva agrega aquí su entrada cuando su ruta existe.
 */
const ENLACES = [{ etiqueta: 'Inicio', ruta: '/', icono: HomeIcon }];

/**
 * Cuerpo del menú lateral, compartido por el modo fijo y el cajón móvil.
 * @param {{ alNavegar?: () => void }} props
 */
function ContenidoMenu({ alNavegar }) {
  const ubicacion = useLocation();

  return (
    <Box sx={{ width: ANCHO_MENU }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <MenuBookIcon color="primary" />
        <Typography variant="h6" noWrap>
          Alejandría UPC
        </Typography>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {ENLACES.map(({ etiqueta, ruta, icono: Icono }) => (
          <ListItemButton
            key={ruta}
            component={RouterLink}
            to={ruta}
            selected={ubicacion.pathname === ruta}
            onClick={alNavegar}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <Icono />
            </ListItemIcon>
            <ListItemText primary={etiqueta} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const esEscritorio = useMediaQuery(theme.breakpoints.up('md'));
  const navegar = useNavigate();
  const { usuario, logout } = useAuth();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [anclaUsuario, setAnclaUsuario] = useState(null);

  const cerrarMenu = () => setMenuAbierto(false);
  const abrirMenuUsuario = (evento) => setAnclaUsuario(evento.currentTarget);
  const cerrarMenuUsuario = () => setAnclaUsuario(null);

  const cerrarSesion = () => {
    cerrarMenuUsuario();
    logout();
    navegar('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100svh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          {!esEscritorio && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Abrir menú"
              onClick={() => setMenuAbierto(true)}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
          >
            Alejandría UPC
          </Typography>

          <Tooltip title="Cuenta">
            <IconButton
              size="small"
              onClick={abrirMenuUsuario}
              aria-label="Abrir menú de usuario"
            >
              <Avatar sx={{ width: 36, height: 36 }}>{iniciales(usuario)}</Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {esEscritorio ? (
        <Drawer
          variant="permanent"
          sx={{
            width: ANCHO_MENU,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' },
          }}
        >
          <ContenidoMenu />
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={menuAbierto}
          onClose={cerrarMenu}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: ANCHO_MENU } }}
        >
          <ContenidoMenu alNavegar={cerrarMenu} />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}
      >
        {/* Espacio que ocupa la barra fija */}
        <Toolbar />
        <Outlet />
      </Box>

      <Menu
        anchorEl={anclaUsuario}
        open={Boolean(anclaUsuario)}
        onClose={cerrarMenuUsuario}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.primary" noWrap>
            {usuario?.nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            @{usuario?.username}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={cerrarSesion}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}
