/**
 * @file FriendsPage.jsx
 * @description Friends and user following network (FE-32, BE-33).
 *
 * Lets students view mutual friends, following, followers, and discover other
 * peers to follow or unfollow.
 */

import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SearchIcon from '@mui/icons-material/Search';

import EmptyState from '../../components/common/EmptyState.jsx';
import UserCard from '../../components/users/UserCard.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  getFollowerUsers,
  getFollowingUsers,
  getFriends,
  searchUsers,
  toggleFollowUser,
} from '../../services/index.js';

export default function FriendsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'following' | 'followers' | 'discover'
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [busyUsername, setBusyUsername] = useState('');
  const [notice, setNotice] = useState('');

  const isLoading = !user || loadedKey !== `${user.username}:${reloadKey}`;

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    Promise.all([getFriends(), getFollowingUsers(), getFollowerUsers(), searchUsers('')])
      .then(([friendsList, followingList, followersList, allStudents]) => {
        if (!active) return;
        setFriends(friendsList);
        setFollowing(followingList);
        setFollowers(followersList);
        setDiscoverUsers(allStudents.filter((candidate) => !candidate.isSelf));
        setError('');
      })
      .catch((serviceError) => {
        if (!active) return;
        setError(serviceError?.message ?? 'No se pudo cargar tu red de amigos.');
      })
      .finally(() => {
        if (active) setLoadedKey(`${user.username}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  const handleToggleFollow = async (targetProfile) => {
    setBusyUsername(targetProfile.username);

    try {
      const updated = await toggleFollowUser(targetProfile.username);
      setNotice(
        updated.isFriend
          ? `Ahora tú y @${updated.username} son amigos (seguimiento mutuo).`
          : updated.isFollowing
            ? `Ahora sigues a @${updated.username}.`
            : `Dejaste de seguir a @${updated.username}.`,
      );
      setReloadKey((k) => k + 1);
    } catch (serviceError) {
      setNotice(serviceError?.message ?? 'No se pudo actualizar el seguimiento.');
    } finally {
      setBusyUsername('');
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredDiscover = discoverUsers.filter((candidate) => {
    if (!normalizedQuery) return true;
    const semesterLabel = candidate.semester ? `semestre ${candidate.semester}` : '';
    return (
      candidate.username.toLowerCase().includes(normalizedQuery) ||
      semesterLabel.includes(normalizedQuery)
    );
  });

  const currentList =
    activeTab === 'friends'
      ? friends
      : activeTab === 'following'
        ? following
        : activeTab === 'followers'
          ? followers
          : filteredDiscover;

  const emptyConfig = {
    friends: {
      icon: HandshakeOutlinedIcon,
      title: 'Aún no tienes amigos mutuos',
      description:
        'Cuando tú y otro estudiante se siguen mutuamente, aparecen aquí como amigos para estudiar y compartir contenido.',
    },
    following: {
      icon: PeopleOutlinedIcon,
      title: 'Aún no sigues a ningún estudiante',
      description:
        'Explora perfiles públicos o la pestaña Descubrir para seguir a compañeros de tu carrera.',
    },
    followers: {
      icon: PersonAddOutlinedIcon,
      title: 'Aún no tienes seguidores',
      description:
        'Comparte repositorios y apuntes de calidad para que otros estudiantes sigan tu perfil.',
    },
    discover: {
      icon: SearchIcon,
      title: 'No encontramos estudiantes con ese criterio',
      description: 'Prueba buscando otro nombre de usuario o semestre.',
    },
  }[activeTab];

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Amigos y comunidad
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sigue a compañeros para recibir sus novedades. Quienes se siguen mutuamente son tus amigos.
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Pestañas de red de amigos"
        >
          <Tab
            value="friends"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Amigos</span>
                <Chip size="small" color="success" label={friends.length} />
              </Box>
            }
          />
          <Tab
            value="following"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Siguiendo</span>
                <Chip size="small" label={following.length} />
              </Box>
            }
          />
          <Tab
            value="followers"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Seguidores</span>
                <Chip size="small" label={followers.length} />
              </Box>
            }
          />
          <Tab
            value="discover"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Descubrir</span>
                <Chip size="small" variant="outlined" label={discoverUsers.length} />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {activeTab === 'discover' && (
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar compañero por @usuario o semestre…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((key) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : currentList.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <EmptyState
              icon={emptyConfig.icon}
              title={emptyConfig.title}
              description={emptyConfig.description}
            />
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {currentList.map((profile) => (
            <Grid key={profile.username} size={{ xs: 12, sm: 6, md: 4 }}>
              <UserCard
                profile={profile}
                isBusy={busyUsername === profile.username}
                onToggleFollow={handleToggleFollow}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        message={notice}
      />
    </Box>
  );
}
