/**
 * @file NotificationBell.jsx
 * @description Notification bell with unread badge and dropdown menu (FE-18, FE-19, FE-32).
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Menu,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';

import { NotificationAvatar, NotificationMessage } from './NotificationAvatar.jsx';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/index.js';
import { formatRelativeDate } from '../../utils/formatDate.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch {
      // Ignore background refresh errors
    }
  }, []);

  useEffect(() => {
    let active = true;
    getUnreadNotificationsCount()
      .then((count) => {
        if (active) setUnreadCount(count);
      })
      .catch(() => {});

    const handleNotificationsChanged = () => {
      refreshCount();
    };

    window.addEventListener('alejandria:notifications-changed', handleNotificationsChanged);
    return () => {
      active = false;
      window.removeEventListener('alejandria:notifications-changed', handleNotificationsChanged);
    };
  }, [refreshCount]);

  const handleOpenMenu = async (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    try {
      const list = await getNotifications();
      setNotifications(list.slice(0, 5));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (item) => {
    handleCloseMenu();
    if (!item.read) {
      try {
        await markNotificationAsRead(item.id);
        window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
      } catch {
        // Continue navigation regardless
      }
    }
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
    } catch {
      // Keep state if failed
    }
  };

  const handleViewAll = () => {
    handleCloseMenu();
    navigate('/notifications');
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          color="inherit"
          onClick={handleOpenMenu}
          aria-label="Abrir notificaciones"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              width: 390,
              maxWidth: '100vw',
              maxHeight: 480,
              borderRadius: 2,
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.25,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem' }}>
              Marcar leídas
            </Button>
          )}
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No tienes notificaciones
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, idx) => (
              <Box key={notification.id}>
                {idx > 0 && <Divider />}
                <ListItemButton
                  onClick={() => handleItemClick(notification)}
                  sx={(theme) => ({
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.25,
                    px: 2,
                    bgcolor: notification.read
                      ? 'transparent'
                      : alpha(theme.palette.primary.main, 0.06),
                    '&:hover': {
                      bgcolor: notification.read
                        ? 'action.hover'
                        : alpha(theme.palette.primary.main, 0.1),
                    },
                  })}
                >
                  <NotificationAvatar type={notification.type} size={36} iconSize={18} />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        flexWrap: 'wrap',
                        mb: 0.15,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={notification.read ? 500 : 700}
                        color="text.primary"
                        sx={{ fontSize: '0.83rem', lineHeight: 1.35 }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: '0.72rem' }}
                      >
                        · {formatRelativeDate(notification.createdAt)}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.8rem',
                        lineHeight: 1.35,
                      }}
                    >
                      <NotificationMessage message={notification.message} />
                    </Typography>
                  </Box>

                  {!notification.read && (
                    <Box
                      aria-label="Sin leer"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </ListItemButton>
              </Box>
            ))}
          </List>
        )}

        <Divider />

        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button fullWidth size="small" onClick={handleViewAll}>
            Ver todas las notificaciones
          </Button>
        </Box>
      </Menu>
    </>
  );
}
