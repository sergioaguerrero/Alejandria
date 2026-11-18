/**
 * @file NotificationsPage.jsx
 * @description View 18 — Notifications (FE-18, FE-19, FE-32, BE-31, BE-32).
 *
 * Full notifications inbox for the current user. Allows filtering by all
 * or unread, marking one or all as read, and navigating directly to the
 * referenced repository, document or profile.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import EmptyState from '../../components/common/EmptyState.jsx';
import {
  NotificationAvatar,
  NotificationMessage,
} from '../../components/common/NotificationAvatar.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/index.js';
import { formatRelativeDate } from '../../utils/formatDate.js';
import { notificationTypeLabel } from '../../utils/notificationMeta.js';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loadedUser, setLoadedUser] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const loading = !user || loadedUser !== `${user.username}:${reloadKey}`;

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    getNotifications()
      .then((data) => {
        if (!active) return;
        setNotifications(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Error al cargar las notificaciones.');
      })
      .finally(() => {
        if (active) setLoadedUser(`${user.username}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
      setSnackbar({ open: true, message: 'Notificación marcada como leída.' });
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || 'No se pudo actualizar la notificación.' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
      setSnackbar({ open: true, message: 'Todas las notificaciones marcadas como leídas.' });
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || 'No se pudieron actualizar las notificaciones.' });
    }
  };

  const handleNavigate = async (item) => {
    if (!item.read) {
      try {
        await markNotificationAsRead(item.id);
        window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
      } catch {
        // Continue navigation
      }
    }
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Novedades de tus materias, interacciones y avisos de moderación.
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Marcar todas como leídas
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs
          value={filter}
          onChange={(_e, val) => setFilter(val)}
          aria-label="Filtro de notificaciones"
          sx={{ minHeight: 42, '& .MuiTab-root': { minHeight: 42, py: 1 } }}
        >
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>Todas</span>
                <Chip
                  size="small"
                  label={notifications.length}
                  sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                />
              </Box>
            }
          />
          <Tab
            value="unread"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>No leídas</span>
                {unreadCount > 0 && (
                  <Chip
                    size="small"
                    color="primary"
                    label={unreadCount}
                    sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Loading state */}
      {loading && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {[1, 2, 3, 4].map((key, idx) => (
            <Box key={key}>
              {idx > 0 && <Divider />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 2, py: 1.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="45%" height={20} />
                  <Skeleton variant="text" width="75%" height={18} />
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Error state */}
      {!loading && error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setReloadKey((k) => k + 1)}>
              Reintentar
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {!loading && !error && filteredNotifications.length === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
          <EmptyState
            icon={NotificationsNoneIcon}
            title={
              filter === 'unread'
                ? 'No tienes notificaciones pendientes'
                : 'Aún no tienes notificaciones'
            }
            description={
              filter === 'unread'
                ? 'Estás al día con todas las novedades de tus materias y contenidos.'
                : 'Cuando haya nuevo material en tus materias de interés o avisos del sistema, aparecerán aquí.'
            }
          />
        </Paper>
      )}

      {/* Feed list */}
      {!loading && !error && filteredNotifications.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {filteredNotifications.map((item, idx) => (
              <Box key={item.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      {!item.read && (
                        <>
                          <Tooltip title="Marcar como leída">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(item.id);
                              }}
                              aria-label="Marcar como leída"
                              sx={{ color: 'text.secondary' }}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Box
                            aria-label="Sin leer"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              mx: 0.5,
                            }}
                          />
                        </>
                      )}
                      {item.targetUrl && (
                        <ChevronRightIcon
                          fontSize="small"
                          sx={{ color: 'text.disabled', pointerEvents: 'none' }}
                        />
                      )}
                    </Stack>
                  }
                >
                  <ListItemButton
                    onClick={() => {
                      if (item.targetUrl) {
                        handleNavigate(item);
                      } else if (!item.read) {
                        handleMarkAsRead(item.id);
                      }
                    }}
                    sx={(theme) => ({
                      alignItems: 'center',
                      gap: 1.75,
                      px: 2.25,
                      py: 1.5,
                      pr: item.read ? 6 : 10,
                      bgcolor: item.read ? 'transparent' : alpha(theme.palette.primary.main, 0.06),
                      '&:hover': {
                        bgcolor: item.read
                          ? 'action.hover'
                          : alpha(theme.palette.primary.main, 0.1),
                      },
                    })}
                  >
                    <NotificationAvatar type={item.type} size={42} iconSize={21} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          flexWrap: 'wrap',
                          mb: 0.25,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={item.read ? 500 : 700}
                          color="text.primary"
                          sx={{ lineHeight: 1.35 }}
                        >
                          {item.title}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={notificationTypeLabel(item.type)}
                          sx={{
                            height: 18,
                            fontSize: '0.68rem',
                            borderColor: 'divider',
                            color: 'text.secondary',
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                          · {formatRelativeDate(item.createdAt)}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.84rem', lineHeight: 1.4 }}
                      >
                        <NotificationMessage message={item.message} />
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Box>
  );
}
