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
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

import NotificationTypeIcon from './NotificationTypeIcon.jsx';
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
              width: 360,
              maxWidth: '100vw',
              maxHeight: 480,
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
            py: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
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
          <List disablePadding sx={{ py: 0.5 }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleItemClick(notification)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1,
                  px: 2,
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                }}
              >
                <ListItemAvatar sx={{ minWidth: 32, mt: 0.5 }}>
                  <NotificationTypeIcon type={notification.type} fontSize="small" />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notification.read ? 400 : 600}
                      color="text.primary"
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block', mt: 0.25 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                        {formatRelativeDate(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
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
