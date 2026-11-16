/**
 * @file ProfileCounters.jsx
 * @description Compact profile metadata counters (followers, following, total likes)
 * styled uniformly with RepositoryDetailPage's icon + body2 metadata row.
 */

import { Link as RouterLink } from 'react-router-dom';

import { Stack, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';

/**
 * @param {object} props
 * @param {number} [props.followers=0]
 * @param {number} [props.following=0]
 * @param {number} [props.likes=0]
 * @param {boolean} [props.linkSocial=false]  Link followers/following counters to /friends.
 */
export default function ProfileCounters({
  followers = 0,
  following = 0,
  likes = 0,
  linkSocial = false,
}) {
  const items = [
    {
      key: 'followers',
      icon: <PeopleOutlinedIcon fontSize="small" />,
      label: `${followers} ${followers === 1 ? 'Seguidor' : 'Seguidores'}`,
      to: linkSocial ? '/friends' : null,
    },
    {
      key: 'following',
      icon: <PersonOutlineIcon fontSize="small" />,
      label: `${following} Siguiendo`,
      to: linkSocial ? '/friends' : null,
    },
    {
      key: 'likes',
      icon: <FavoriteBorderIcon fontSize="small" />,
      label: `${likes} Me gusta`,
      to: null,
    },
  ];

  return (
    <Stack direction="row" useFlexGap spacing={2.5} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      {items.map(({ key, icon, label, to }) => (
        <Stack
          key={key}
          direction="row"
          spacing={0.75}
          {...(to ? { component: RouterLink, to } : {})}
          sx={{
            alignItems: 'center',
            color: 'text.secondary',
            ...(to ? { textDecoration: 'none', '&:hover': { color: 'primary.main' } } : {}),
          }}
        >
          {icon}
          <Typography variant="body2" color="inherit">
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
