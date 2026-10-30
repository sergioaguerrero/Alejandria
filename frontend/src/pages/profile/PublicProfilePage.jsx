/**
 * @file PublicProfilePage.jsx
 * @description View 16 — Public profile (FE-13, endpoint BE-14).
 *
 * Shows the @username and the repositories of that user with the same cards of
 * the home view. The email and the full name are never exposed. The visitor can
 * report the profile with the shared report dialog.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import EmptyState from '../../components/common/EmptyState.jsx';
import ReportDialog from '../../components/common/ReportDialog.jsx';
import RepositoryCard from '../../components/repositories/RepositoryCard.jsx';
import { useAuth } from '../../context/authContext.js';
import { getPublicProfile, getRepositoriesByUser } from '../../services/index.js';
import { initials } from '../../utils/users.js';

/** Grid shared by the cards and the loading skeletons, as in the home view. */
const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
  },
  gap: 2.5,
};

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();

  const [loaded, setLoaded] = useState({ key: null, profile: null, repositories: [], error: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  // Loads the public data and the repositories together. The `key` lets the
  // render know whether the data belongs to the username of the URL.
  useEffect(() => {
    let active = true;

    Promise.all([getPublicProfile(username), getRepositoriesByUser(username)])
      .then(([profile, repositories]) => {
        if (active) setLoaded({ key: username, profile, repositories, error: '' });
      })
      .catch((serviceError) => {
        if (!active) return;
        setLoaded({
          key: username,
          profile: null,
          repositories: [],
          error: serviceError?.message ?? 'No se pudo cargar el perfil.',
        });
      });

    return () => {
      active = false;
    };
  }, [username]);

  const isLoading = loaded.key !== username;
  const isOwnProfile = Boolean(user?.username && user.username === username);

  const handleReported = () => {
    setReportOpen(false);
    setNotice({
      severity: 'success',
      message: 'Gracias por tu reporte. El equipo de administración lo revisará.',
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={140} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={32} width={240} sx={{ mb: 2 }} />
        <Box sx={GRID_SX}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={180} />
          ))}
        </Box>
      </Box>
    );
  }

  if (loaded.error) {
    return (
      <Box>
        <Button
          component={RouterLink}
          to="/"
          variant="text"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, px: 0 }}
        >
          Volver a explorar
        </Button>

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/">
              Ir al inicio
            </Button>
          }
        >
          {loaded.error}
        </Alert>
      </Box>
    );
  }

  const profile = loaded.profile;
  const repositories = loaded.repositories;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
              {initials(profile)}
            </Avatar>

            <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
              <Typography variant="overline" color="text.secondary">
                Perfil público
              </Typography>
              <Typography variant="h4" component="h1" fontWeight={700}>
                {`@${profile.username}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${repositories.length} ${repositories.length === 1 ? 'repositorio' : 'repositorios'}`}
              </Typography>
            </Stack>

            {!isOwnProfile && (
              <Button
                variant="outlined"
                startIcon={<FlagOutlinedIcon />}
                onClick={() => setReportOpen(true)}
              >
                Reportar perfil
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 2 }}>
        Repositorios
      </Typography>

      {repositories.length === 0 ? (
        <EmptyState
          icon={FolderOpenIcon}
          title="Este usuario todavía no tiene repositorios"
          description="Cuando publique material de estudio aparecerá aquí."
        />
      ) : (
        <Box sx={GRID_SX}>
          {repositories.map((repository) => (
            <RepositoryCard key={repository.id} repository={repository} />
          ))}
        </Box>
      )}

      <ReportDialog
        open={reportOpen}
        targetType="profile"
        targetId={profile.username}
        targetLabel={`@${profile.username}`}
        onClose={() => setReportOpen(false)}
        onReported={handleReported}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
      >
        <Alert
          severity={notice?.severity ?? 'success'}
          variant="filled"
          onClose={() => setNotice(null)}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
