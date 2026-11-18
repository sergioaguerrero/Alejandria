/**
 * @file PublicProfilePage.jsx
 * @description View 16 — Public profile (FE-13, endpoint BE-14).
 *
 * Shows the public academic profile of a student with the institutional banner layout,
 * overlapping avatar, public repositories, and uploaded documents.
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
  Chip,
  Grid,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EmptyState from '../../components/common/EmptyState.jsx';
import ReportDialog from '../../components/common/ReportDialog.jsx';
import RepositoryCard from '../../components/repositories/RepositoryCard.jsx';
import ProfileBioAndContacts from '../../components/users/ProfileBioAndContacts.jsx';
import ProfileCounters from '../../components/users/ProfileCounters.jsx';
import { useAuth } from '../../context/authContext.js';
import { MATERIAL_TYPES, TERMS } from '../../mocks/catalogs.js';
import {
  getDocumentsByUser,
  getPublicProfile,
  getRepositoriesByUser,
  toggleFollowUser,
} from '../../services/index.js';

function materialTypeLabel(type) {
  return MATERIAL_TYPES.find((m) => m.value === type)?.label ?? type;
}

function termLabel(term) {
  return TERMS.find((t) => t.value === term)?.label ?? `Corte ${term}`;
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();

  const [loaded, setLoaded] = useState({
    key: null,
    profile: null,
    repositories: [],
    documents: [],
    error: '',
  });
  const [activeTab, setActiveTab] = useState('repositories'); // 'repositories' | 'documents'
  const [reportOpen, setReportOpen] = useState(false);
  const [isFollowingBusy, setIsFollowingBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      getPublicProfile(username),
      getRepositoriesByUser(username),
      getDocumentsByUser(username),
    ])
      .then(([profile, repositories, documents]) => {
        if (!active) return;
        setLoaded({
          key: username,
          profile,
          repositories,
          documents,
          error: '',
        });
      })
      .catch((serviceError) => {
        if (!active) return;
        setLoaded({
          key: username,
          profile: null,
          repositories: [],
          documents: [],
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

  const totalLikes =
    loaded.repositories.reduce((acc, repo) => acc + (repo.likes || 0), 0) +
    loaded.documents.reduce((acc, doc) => acc + (doc.likes || 0), 0);

  const handleToggleFollow = async () => {
    if (!loaded.profile) return;
    setIsFollowingBusy(true);
    try {
      const updatedProfile = await toggleFollowUser(loaded.profile.username);
      setLoaded((prev) => ({ ...prev, profile: updatedProfile }));
      setNotice({
        severity: 'success',
        message: updatedProfile.isFriend
          ? `Ahora tú y @${updatedProfile.username} son amigos (seguimiento mutuo).`
          : updatedProfile.isFollowing
            ? `Ahora sigues a @${updatedProfile.username}.`
            : `Dejaste de seguir a @${updatedProfile.username}.`,
      });
    } catch (serviceError) {
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo actualizar el seguimiento.',
      });
    } finally {
      setIsFollowingBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        Volver a explorar
      </Button>

      {/* Loading State */}
      {isLoading && (
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={180} />
          <Skeleton variant="rounded" height={48} width="50%" />
          <Grid container spacing={2.5}>
            {[1, 2, 3].map((key) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={180} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}

      {/* Error State */}
      {!isLoading && loaded.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {loaded.error}
        </Alert>
      )}

      {/* Content */}
      {!isLoading && !loaded.error && loaded.profile && (
        <>
          {/* Banner with project palette gradient */}
          <Box
            sx={{
              width: '100%',
              height: { xs: 150, sm: 200, md: 230 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0B1220 0%, #152944 35%, #1D3557 70%, #2563EB 100%)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />

          {/* Profile Header Information */}
          <Box sx={{ px: { xs: 2, sm: 3 }, position: 'relative', mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'flex-start' },
                justifyContent: 'space-between',
                gap: 2.5,
                mb: 2.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'flex-start' },
                  gap: { xs: 1.5, sm: 2.5 },
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 90, sm: 110, md: 120 },
                    height: { xs: 90, sm: 110, md: 120 },
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    fontWeight: 700,
                    bgcolor: '#F59E0B',
                    color: '#0B1220',
                    border: '4px solid',
                    borderColor: 'background.paper',
                    boxShadow: 3,
                    mt: { xs: -5.5, sm: -7, md: -7.5 },
                    flexShrink: 0,
                  }}
                >
                  {loaded.profile.username.slice(0, 2).toUpperCase()}
                </Avatar>

                <Box sx={{ pt: { xs: 0, sm: 1.5 } }}>
                  <Typography variant="h4" component="h1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    @{loaded.profile.username}
                  </Typography>
                  <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loaded.profile.role === 'admin'
                      ? 'Administración · Universidad Popular del Cesar'
                      : loaded.profile.semester
                        ? `Ingeniería de Sistemas · Semestre ${loaded.profile.semester} · Universidad Popular del Cesar`
                        : 'Estudiante de Ingeniería de Sistemas · Universidad Popular del Cesar'}
                    {!isOwnProfile && (loaded.profile.isFriend || loaded.profile.followsMe) && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {loaded.profile.isFriend ? (
                          <Chip
                            size="small"
                            color="success"
                            icon={<HandshakeOutlinedIcon />}
                            label="Amigo (seguimiento mutuo)"
                          />
                        ) : (
                          <Chip size="small" color="info" variant="outlined" label="Te sigue" />
                        )}
                      </Stack>
                    )}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  pt: { xs: 0, md: 2 },
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                {!isOwnProfile && (
                  <Button
                    variant={loaded.profile.isFollowing ? 'outlined' : 'contained'}
                    color={loaded.profile.isFollowing ? 'inherit' : 'primary'}
                    startIcon={loaded.profile.isFollowing ? <CheckIcon /> : <PersonAddOutlinedIcon />}
                    disabled={isFollowingBusy}
                    onClick={handleToggleFollow}
                    sx={{
                      px: 2.5,
                      py: 1,
                      minWidth: 172,
                      border: '1px solid',
                      borderColor: loaded.profile.isFollowing ? 'divider' : 'transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {loaded.profile.isFollowing
                      ? 'Siguiendo'
                      : loaded.profile.followsMe
                        ? 'Seguir también'
                        : 'Seguir'}
                  </Button>
                )}
                {isOwnProfile ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditOutlinedIcon />}
                    component={RouterLink}
                    to="/profile"
                    sx={{ px: 2.5, py: 1 }}
                  >
                    Editar mi perfil
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<FlagOutlinedIcon />}
                    onClick={() => setReportOpen(true)}
                    sx={{ px: 2.5, py: 1 }}
                  >
                    Reportar perfil
                  </Button>
                )}
              </Box>
            </Box>

            {/* Counters Row */}
            <ProfileCounters
              followers={loaded.profile.followersCount ?? 0}
              following={loaded.profile.followingCount ?? 0}
              likes={totalLikes}
            />

            {/* Bio & Contact Methods */}
            <ProfileBioAndContacts
              bio={loaded.profile.bio}
              contacts={loaded.profile.contacts}
              isOwnProfile={false}
              onNotice={setNotice}
            />
          </Box>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_e, val) => setActiveTab(val)}
              aria-label="Pestañas de contenidos del perfil público"
            >
              <Tab
                value="repositories"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Repositorios</span>
                    <Chip size="small" label={loaded.repositories.length} />
                  </Box>
                }
              />
              <Tab
                value="documents"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Documentos</span>
                    <Chip size="small" label={loaded.documents.length} />
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          {/* Repositories Tab */}
          {activeTab === 'repositories' && (
            <>
              {loaded.repositories.length === 0 ? (
                <Card variant="outlined">
                  <CardContent>
                    <EmptyState
                      icon={FolderOutlinedIcon}
                      title="Este usuario aún no tiene repositorios públicos"
                      description="Cuando cree y comparta repositorios de estudio, aparecerán en este espacio."
                    />
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={2.5}>
                  {loaded.repositories.map((repo) => (
                    <Grid key={repo.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <RepositoryCard repository={repo} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <>
              {loaded.documents.length === 0 ? (
                <Card variant="outlined">
                  <CardContent>
                    <EmptyState
                      icon={DescriptionOutlinedIcon}
                      title="Este usuario no ha subido documentos aún"
                      description="El material académico aportado por el estudiante se listará aquí."
                    />
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={2}>
                  {loaded.documents.map((doc) => (
                    <Card
                      key={doc.id}
                      variant="outlined"
                      sx={{
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: 2 },
                      }}
                    >
                      <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                              <Chip
                                size="small"
                                variant="outlined"
                                color="primary"
                                label={doc.subject?.name ?? 'Sin materia'}
                              />
                              <Chip size="small" label={materialTypeLabel(doc.type)} />
                              <Chip size="small" variant="outlined" label={termLabel(doc.term)} />
                            </Box>

                            <Typography
                              component={RouterLink}
                              to={`/documents/${doc.id}`}
                              variant="subtitle1"
                              fontWeight={600}
                              sx={{
                                color: 'text.primary',
                                textDecoration: 'none',
                                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                              }}
                            >
                              {doc.title}
                            </Typography>

                            {doc.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mt: 0.5,
                                }}
                              >
                                {doc.description}
                              </Typography>
                            )}
                          </Box>

                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VisibilityOutlinedIcon fontSize="small" />
                              <Typography variant="caption">{doc.views || 0}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DownloadOutlinedIcon fontSize="small" />
                              <Typography variant="caption">{doc.downloads || 0}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </>
          )}

          <ReportDialog
            open={reportOpen}
            targetType="profile"
            targetId={loaded.profile.username}
            targetLabel={`@${loaded.profile.username}`}
            onClose={() => setReportOpen(false)}
            onReported={handleReported}
          />
        </>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        message={notice?.message}
      />
    </Box>
  );
}
