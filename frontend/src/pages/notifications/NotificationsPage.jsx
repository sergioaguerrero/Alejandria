/**
 * @file NotificationsPage.jsx
 * @description View 18 — Notifications (FE-18, FE-19, BE-31, BE-32).
 *
 * Full notifications inbox for the current user. Allows filtering by all
 * or unread, marking one or all as read, and navigating directly to the
 * referenced repository or document.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/index.js';
import { formatRelativeDate } from '../../utils/formatDate.js';

/**
 * Returns an icon corresponding to the notification type.
 * @param {string} type
 */
function NotificationTypeIcon({ type }) {
  switch (type) {
    case 'warning':
    case 'content_hidden':
      return <WarningAmberOutlinedIcon color="warning" sx={{ fontSize: 28 }} />;
    case 'sanction':
    case 'content_deleted':
    case 'report_pending':
      return <ReportProblemOutlinedIcon color="error" sx={{ fontSize: 28 }} />;
    case 'like':
      return <ThumbUpOutlinedIcon color="primary" sx={{ fontSize: 28 }} />;
    case 'new_content':
      return <DescriptionOutlinedIcon color="primary" sx={{ fontSize: 28 }} />;
    default:
      return <FolderOutlinedIcon color="action" sx={{ fontSize: 28 }} />;
  }
}

/**
 * Returns a human label for the notification type.
 * @param {string} type
 */
function notificationTypeLabel(type) {
  switch (type) {
    case 'new_content':
      return 'Novedad';
    case 'warning':
      return 'Advertencia';
    case 'content_hidden':
      return 'Contenido ocultado';
    case 'content_deleted':
      return 'Contenido eliminado';
    case 'sanction':
      return 'Sanción';
    case 'like':
      return 'Interacción';
    case 'report_pending':
      return 'Moderación';
    default:
      return 'Aviso';
  }
}

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
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Novedades de tus materias, interacciones y avisos de moderación.
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            size="small"
          >
            Marcar todas como leídas
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={filter}
          onChange={(_e, val) => setFilter(val)}
          aria-label="Filtro de notificaciones"
        >
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Todas</span>
                <Chip size="small" label={notifications.length} />
              </Box>
            }
          />
          <Tab
            value="unread"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>No leídas</span>
                {unreadCount > 0 && (
                  <Chip size="small" color="primary" label={unreadCount} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Loading state */}
      {loading && (
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((key) => (
            <Card key={key} variant="outlined">
              <CardContent>
                <Skeleton variant="text" width="40%" height={28} />
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="20%" height={16} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
        </Stack>
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
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {!loading && !error && filteredNotifications.length === 0 && (
        <Card variant="outlined">
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* List */}
      {!loading && !error && filteredNotifications.length > 0 && (
        <Stack spacing={2}>
          {filteredNotifications.map((item) => (
            <Card
              key={item.id}
              variant="outlined"
              sx={{
                position: 'relative',
                transition: 'box-shadow 0.2s ease',
                bgcolor: item.read ? 'background.paper' : 'action.hover',
                borderLeft: item.read ? '1px solid' : '4px solid',
                borderLeftColor: item.read ? 'divider' : 'primary.main',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ pt: 0.5 }}>
                    <NotificationTypeIcon type={item.type} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={item.read ? 600 : 700}
                        color="text.primary"
                      >
                        {item.title}
                      </Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={notificationTypeLabel(item.type)}
                      />
                      {!item.read && (
                        <Chip
                          size="small"
                          color="primary"
                          label="Nueva"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.message}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.disabled">
                        {formatRelativeDate(item.createdAt)}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!item.read && (
                          <Tooltip title="Marcar como leída">
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(item.id)}
                              aria-label="Marcar como leída"
                            >
                              <CheckCircleOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {item.targetUrl && (
                          <Button
                            size="small"
                            variant="text"
                            endIcon={<OpenInNewIcon fontSize="small" />}
                            onClick={() => handleNavigate(item)}
                          >
                            Ver contenido
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
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
