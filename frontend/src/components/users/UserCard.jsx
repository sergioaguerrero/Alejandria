/**
 * @file UserCard.jsx
 * @description Reusable student connection card showing follow status and
 * mutual friendship badge (FE-32).
 */

import { Link as RouterLink } from 'react-router-dom';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

/**
 * @param {object} props
 * @param {object} props.profile
 * @param {boolean} [props.isBusy]
 * @param {(profile: object) => void} props.onToggleFollow
 */
export default function UserCard({ profile, isBusy = false, onToggleFollow }) {
  const followLabel = profile.isFollowing
    ? 'Siguiendo'
    : profile.followsMe
      ? 'Seguir también'
      : 'Seguir';

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
          <Avatar
            component={RouterLink}
            to={`/users/${profile.username}`}
            sx={{
              width: 48,
              height: 48,
              fontWeight: 700,
              bgcolor: profile.isFriend ? 'success.main' : 'primary.main',
              color: 'primary.contrastText',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            {profile.username.slice(0, 2).toUpperCase()}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component={RouterLink}
              to={`/users/${profile.username}`}
              variant="subtitle1"
              fontWeight={700}
              noWrap
              sx={{
                display: 'block',
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              @{profile.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {profile.semester
                ? `Ingeniería de Sistemas · Semestre ${profile.semester}`
                : 'Comunidad Alejandría'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
          {profile.isFriend && (
            <Chip
              size="small"
              color="success"
              icon={<HandshakeOutlinedIcon />}
              label="Amigo (seguimiento mutuo)"
            />
          )}
          {!profile.isFriend && profile.followsMe && (
            <Chip size="small" color="info" variant="outlined" label="Te sigue" />
          )}
          {profile.isSelf && <Chip size="small" variant="outlined" label="Tú" />}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {`${profile.followersCount ?? 0} seguidores · ${profile.followingCount ?? 0} siguiendo`}
        </Typography>

        <Box sx={{ mt: 'auto', pt: 0.5, display: 'flex', gap: 1 }}>
          <Button
            component={RouterLink}
            to={`/users/${profile.username}`}
            variant="text"
            size="small"
            sx={{ flex: 1 }}
          >
            Ver perfil
          </Button>

          {!profile.isSelf && (
            <Button
              variant={profile.isFollowing ? 'outlined' : 'contained'}
              color={profile.isFollowing ? 'inherit' : 'primary'}
              size="small"
              disabled={isBusy}
              startIcon={profile.isFollowing ? <CheckIcon /> : <PersonAddOutlinedIcon />}
              onClick={() => onToggleFollow(profile)}
              sx={{ flex: 1 }}
            >
              {followLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
