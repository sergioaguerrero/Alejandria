/**
 * @file AppLayout.jsx
 * @description Structure of all views with an active session (FE-03).
 *
 * Fixed top bar + side menu:
 *   - Desktop: fixed menu visible.
 *   - Mobile and tablet: drawer-style menu opened by the hamburger button.
 *
 * Views are rendered in <Outlet />. The menu grows as views are
 * implemented: for now only Home (FE-10).
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
import MenuIcon from '@mui/icons-material/Menu';

import { useAuth } from '../../context/authContext.js';
import { initials } from '../../utils/users.js';

const MENU_WIDTH = 248;

/**
 * Side menu links.
 * Each new view adds its entry here once its route exists.
 */
const LINKS = [{ label: 'Inicio', path: '/', icon: HomeIcon }];

/**
 * Side menu body, shared by the fixed mode and the mobile drawer.
 * @param {{ onNavigate?: () => void }} props
 */
function MenuContent({ onNavigate }) {
  const location = useLocation();

  return (
    <Box sx={{ width: MENU_WIDTH }}>
      {/* Space taken by the fixed top bar */}
      <Toolbar />

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {LINKS.map(({ label, path, icon: Icon }) => (
          <ListItemButton
            key={path}
            component={RouterLink}
            to={path}
            selected={location.pathname === path}
            onClick={onNavigate}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userAnchor, setUserAnchor] = useState(null);

  const closeMenu = () => setMenuOpen(false);
  const openUserMenu = (event) => setUserAnchor(event.currentTarget);
  const closeUserMenu = () => setUserAnchor(null);

  const handleLogout = () => {
    closeUserMenu();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100svh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
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
              onClick={openUserMenu}
              aria-label="Abrir menú de usuario"
            >
              <Avatar sx={{ width: 36, height: 36 }}>{initials(user)}</Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: MENU_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: MENU_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <MenuContent />
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={menuOpen}
          onClose={closeMenu}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: MENU_WIDTH } }}
        >
          <MenuContent onNavigate={closeMenu} />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}
      >
        {/* Space taken by the fixed bar */}
        <Toolbar />
        <Outlet />
      </Box>

      <Menu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={closeUserMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.primary" noWrap>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            @{user?.username}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}
