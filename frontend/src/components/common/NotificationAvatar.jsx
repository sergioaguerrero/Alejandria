/**
 * @file NotificationAvatar.jsx
 * @description Shared circular icon avatar and mention-highlighted text for notifications.
 */

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

import NotificationTypeIcon from './NotificationTypeIcon.jsx';
import { getNotificationAccent, splitMentionSegments } from '../../utils/notificationMeta.js';

/**
 * @param {object} props
 * @param {string} props.type
 * @param {number} [props.size=42]
 * @param {number} [props.iconSize=21]
 */
export function NotificationAvatar({ type, size = 42, iconSize = 21 }) {
  const accent = getNotificationAccent(type);

  return (
    <Box
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette[accent].main, 0.14),
      })}
    >
      <NotificationTypeIcon type={type} sx={{ fontSize: iconSize }} />
    </Box>
  );
}

/**
 * @param {object} props
 * @param {string} props.message
 */
export function NotificationMessage({ message }) {
  return splitMentionSegments(message).map((segment, index) =>
    segment.isMention ? (
      <Box
        key={`${segment.text}-${index}`}
        component="span"
        sx={{ fontWeight: 600, color: 'text.primary' }}
      >
        {segment.text}
      </Box>
    ) : (
      segment.text
    ),
  );
}
