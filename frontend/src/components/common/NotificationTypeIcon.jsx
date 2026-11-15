/**
 * @file NotificationTypeIcon.jsx
 * @description Shared icon renderer for notifications in the bell menu and inbox.
 */

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

/**
 * @param {object} props
 * @param {string} props.type
 * @param {'small'|'medium'} [props.fontSize='small']
 * @param {object} [props.sx]
 */
export default function NotificationTypeIcon({ type, fontSize = 'small', sx }) {
  switch (type) {
    case 'warning':
    case 'content_hidden':
      return <WarningAmberOutlinedIcon color="warning" fontSize={fontSize} sx={sx} />;
    case 'sanction':
    case 'content_deleted':
    case 'report_pending':
      return <ReportProblemOutlinedIcon color="error" fontSize={fontSize} sx={sx} />;
    case 'like':
      return <ThumbUpOutlinedIcon color="primary" fontSize={fontSize} sx={sx} />;
    case 'new_content':
      return <DescriptionOutlinedIcon color="primary" fontSize={fontSize} sx={sx} />;
    case 'new_follower':
      return <PersonAddOutlinedIcon color="primary" fontSize={fontSize} sx={sx} />;
    case 'friend_match':
      return <HandshakeOutlinedIcon color="success" fontSize={fontSize} sx={sx} />;
    case 'ai_shared':
      return <AutoAwesomeOutlinedIcon color="primary" fontSize={fontSize} sx={sx} />;
    case 'collab_invite':
      return <GroupAddOutlinedIcon color="secondary" fontSize={fontSize} sx={sx} />;
    default:
      return <FolderOutlinedIcon color="action" fontSize={fontSize} sx={sx} />;
  }
}
