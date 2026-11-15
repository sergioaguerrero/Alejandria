/**
 * @file AppLayout.jsx
 * @description Structure of all views with an active session (FE-03).
 *
 * Fixed top bar + side menu:
 *   - Desktop: fixed menu visible.
 *   - Mobile and tablet: drawer-style menu opened by the hamburger button.
 *
 * Views are rendered in <Outlet />. The side menu lists every planned
 * section; the ones that are not implemented yet lead to the error page
 * (view 26) until their story lands.
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
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Link,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import ClearIcon from '@mui/icons-material/Clear';
import ExploreIcon from '@mui/icons-material/Explore';
import FlagIcon from '@mui/icons-material/Flag';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import InsightsIcon from '@mui/icons-material/Insights';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SchoolIcon from '@mui/icons-material/School';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

import { useAuth } from '../../context/authContext.js';
import { useThemeMode } from '../../context/themeContext.js';
import LighthouseMark from '../brand/LighthouseMark.jsx';
import NotificationBell from '../common/NotificationBell.jsx';
import { initials, usernameLabel } from '../../utils/users.js';

const MENU_WIDTH = 248;

/**
 * Main side menu links (views 6 to 21).
 * The view that is not implemented yet renders the error page (view 26).
 */
const MAIN_LINKS = [
  { label: 'Inicio', path: '/', icon: HomeIcon },
  { label: 'Explorar', path: '/search', icon: ExploreIcon },
  { label: 'Mis repositorios', path: '/my-content', icon: FolderIcon },
  { label: 'Mis materias', path: '/my-subjects', icon: BookmarksIcon },
  { label: 'Mis estadísticas', path: '/statistics', icon: BarChartIcon },
  { label: 'Notificaciones', path: '/notifications', icon: NotificationsIcon },
  { label: 'Estudio con IA', path: '/ai', icon: SmartToyIcon },
  { label: 'Mi estudio', path: '/ai/my-study', icon: SchoolIcon },
  { label: 'Amigos', path: '/friends', icon: PeopleOutlinedIcon },
  { label: 'Mi perfil', path: '/profile', icon: PersonIcon },
];

/**
 * Admin-only links. They are not rendered unless the user role is admin.
 */
const ADMIN_LINKS = [
  { label: 'Reportes', path: '/admin/reports', icon: FlagIcon },
  { label: 'Estadísticas globales', path: '/admin/statistics', icon: InsightsIcon },
];

/**
 * Indicates if the link matches the current route.
 * Home only matches exactly; the rest also match their child routes.
 * @param {string} pathname
 * @param {string} path
 * @returns {boolean}
 */
function isActive(pathname, path) {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * One entry of the side menu.
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.path
 * @param {import('react').ElementType} props.icon
 * @param {string} props.pathname
 * @param {() => void} [props.onNavigate]
 */
function MenuLink({ label, path, icon: Icon, pathname, onNavigate }) {
  return (
    <ListItemButton
      component={RouterLink}
      to={path}
      selected={isActive(pathname, path)}
      onClick={onNavigate}
      sx={{ borderRadius: 2, mb: 0.5 }}
    >
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

/**
 * Side menu body, shared by the fixed mode and the mobile drawer.
 * @param {{ onNavigate?: () => void, isAdmin?: boolean }} props
 */
function MenuContent({ onNavigate, isAdmin = false }) {
  const location = useLocation();

  return (
    <Box sx={{ width: MENU_WIDTH }}>
      {/* Space taken by the fixed top bar */}
      <Toolbar />

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {MAIN_LINKS.map((link) => (
          <MenuLink
            key={link.path}
            {...link}
            pathname={location.pathname}
            onNavigate={onNavigate}
          />
        ))}

        {isAdmin && (
          <>
            <Divider sx={{ my: 1.5 }} />

            <ListSubheader
              disableSticky
              sx={{ bgcolor: 'transparent', lineHeight: 2.5, px: 2 }}
            >
              Administración
            </ListSubheader>

            {ADMIN_LINKS.map((link) => (
              <MenuLink
                key={link.path}
                {...link}
                pathname={location.pathname}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}
      </List>
    </Box>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { mode, toggleThemeMode } = useThemeMode();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userAnchor, setUserAnchor] = useState(null);
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(location.search).get('q') ?? '',
  );
  const [syncedSearch, setSyncedSearch] = useState(
    location.pathname === '/search' ? location.search : null,
  );

  // Keeps the search field in sync with the URL (?q=) when the user lands on
  // the search view, submits a search or navigates back to it. This is the
  // "adjust state while rendering" pattern, cheaper than an effect.
  if (location.pathname === '/search') {
    if (location.search !== syncedSearch) {
      setSyncedSearch(location.search);
      setSearchTerm(new URLSearchParams(location.search).get('q') ?? '');
    }
  } else if (syncedSearch !== null) {
    // Leaving the search view drops the baseline so coming back re-reads ?q=.
    setSyncedSearch(null);
  }

  const closeMenu = () => setMenuOpen(false);
  const openUserMenu = (event) => setUserAnchor(event.currentTarget);
  const closeUserMenu = () => setUserAnchor(null);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

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

          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              textDecoration: 'none',
              color: 'inherit',
              mr: { md: 2 },
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            <LighthouseMark size={18} sx={{ p: '5px', borderRadius: '7px' }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              Alejandría
            </Typography>
          </Box>

          {isDesktop ? (
            <Box
              component="form"
              role="search"
              onSubmit={handleSearchSubmit}
              sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', px: 2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  maxWidth: 560,
                  px: 2,
                  py: 0.75,
                  borderRadius: 999,
                  bgcolor: 'action.hover',
                  '&:focus-within': { outline: '2px solid', outlineColor: 'primary.main' },
                }}
              >
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />

                <InputBase
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar materias, apuntes y usuarios…"
                  inputProps={{ 'aria-label': 'Buscar materias, apuntes y usuarios' }}
                  sx={{ flex: 1, fontSize: '0.95rem' }}
                />

                {searchTerm && (
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setSearchTerm('')}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          ) : (
            <IconButton color="inherit" aria-label="Buscar" onClick={() => navigate('/search')}>
              <SearchIcon />
            </IconButton>
          )}

          <Tooltip title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            <IconButton
              color="inherit"
              onClick={toggleThemeMode}
              aria-label={mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Tooltip>

          <NotificationBell />

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
          <MenuContent isAdmin={isAdmin} />
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={menuOpen}
          onClose={closeMenu}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: MENU_WIDTH } }}
        >
          <MenuContent onNavigate={closeMenu} isAdmin={isAdmin} />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}
      >
        {/* Space taken by the fixed bar */}
        <Toolbar />
        <Outlet />

        <Box
          component="footer"
          sx={{ mt: 6, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}
        >
          <Typography variant="caption" color="text.secondary">
            {`© ${new Date().getFullYear()} Alejandría · `}
            <Link component={RouterLink} to="/terms" color="inherit">
              Normas de uso
            </Link>
          </Typography>
        </Box>
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
            {usernameLabel(user)}
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
