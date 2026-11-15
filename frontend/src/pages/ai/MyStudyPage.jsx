/**
 * @file MyStudyPage.jsx
 * @description View 21 — My Study & Shared AI Content (FE-22, FE-33, BE-36, BE-38).
 *
 * Displays saved AI quizzes and AI materials shared by mutual friends,
 * allowing students to review scores, reopen questionnaires, share their
 * own study content exclusively with mutual friends, and remove saved items.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

import ShareAiDialog from '../../components/ai/ShareAiDialog.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  deleteFromMyStudy,
  getMyStudyMaterials,
  getSharedWithMeAiMaterials,
} from '../../services/index.js';

export default function MyStudyPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [sharedMaterials, setSharedMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [loadedKey, setLoadedKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Share modal state
  const [shareTarget, setShareTarget] = useState(null);

  // Delete modal state
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isLoading = !user || loadedKey !== user.username;

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    Promise.all([getMyStudyMaterials(), getSharedWithMeAiMaterials()])
      .then(([mine, shared]) => {
        if (!active) return;
        setMaterials(mine);
        setSharedMaterials(shared);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(err?.message || 'Error al cargar tu material de estudio.');
      })
      .finally(() => {
        if (active) setLoadedKey(user.username);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleOpenDelete = (item) => {
    setTargetToDelete(item);
  };

  const handleCloseDelete = () => {
    if (!isDeleting) {
      setTargetToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetToDelete) return;
    setIsDeleting(true);

    try {
      await deleteFromMyStudy(targetToDelete.id);
      setMaterials((prev) => prev.filter((m) => m.id !== targetToDelete.id));
      setSnackbar({
        open: true,
        message: 'Cuestionario eliminado de Mi estudio.',
        severity: 'success',
      });
      setTargetToDelete(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'Error al eliminar de Mi estudio.',
        severity: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isSharedTab = activeTab === 'shared';
  const displayedMaterials = isSharedTab ? sharedMaterials : materials;

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 2 }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <SchoolOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" component="h1" fontWeight={700}>
              Mi estudio
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Consulta y repasa tus cuestionarios guardados o el contenido de IA compartido por tus amigos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            component={RouterLink}
            to="/ai"
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
          >
            Generar cuestionario
          </Button>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, val) => setActiveTab(val)}
          aria-label="Secciones de Mi estudio"
        >
          <Tab value="mine" label={`Guardados por mí (${materials.length})`} />
          <Tab value="shared" label={`Compartidos conmigo (${sharedMaterials.length})`} />
        </Tabs>
      </Box>

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((n) => (
            <Grid key={n} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && !errorMessage && displayedMaterials.length === 0 && (
        isSharedTab ? (
          <EmptyState
            icon={PeopleOutlinedIcon}
            title="Aún no han compartido contenido de IA contigo"
            description="Cuando alguno de tus amigos mutuos comparta un material de IA contigo, aparecerá aquí para que puedas estudiarlo."
            action={
              <Button component={RouterLink} to="/friends" variant="outlined">
                Ver mis amigos
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={BookmarkBorderOutlinedIcon}
            title="Aún no tienes material de estudio guardado"
            description="Genera un cuestionario interactivo con IA a partir de cualquier repositorio de tu interés y guárdalo para practicar antes de tus exámenes."
            action={
              <Button
                component={RouterLink}
                to="/ai"
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
              >
                Comenzar a estudiar
              </Button>
            }
          />
        )
      )}

      {/* Material Grid */}
      {!isLoading && !errorMessage && displayedMaterials.length > 0 && (
        <Grid container spacing={2.5}>
          {displayedMaterials.map((item) => {
            const hasScore = typeof item.lastScore === 'number';
            const scoreColor =
              item.lastScore >= 80 ? 'success' : item.lastScore >= 60 ? 'warning' : 'error';
            const dateToShow = isSharedTab ? item.sharedAt || item.createdAt : item.createdAt;

            return (
              <Grid key={item.shareId || item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}
                    >
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={item.subjectName || 'Materia'}
                        sx={{ maxWidth: 165 }}
                      />
                      {isSharedTab ? (
                        <Chip
                          size="small"
                          color="info"
                          variant="outlined"
                          label={`@${item.sharedBy}`}
                          sx={{ fontWeight: 600 }}
                        />
                      ) : hasScore ? (
                        <Chip
                          size="small"
                          color={scoreColor}
                          label={`Último: ${item.lastScore}%`}
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Sin resolver"
                          sx={{ color: 'text.secondary', borderColor: 'divider' }}
                        />
                      )}
                    </Stack>

                    <Typography variant="h6" component="h2" fontWeight={600} gutterBottom>
                      {item.title}
                    </Typography>

                    <Stack spacing={0.75} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: 220 }}
                        >
                          {item.repositoryName}
                        </Typography>
                      </Box>
                      {item.scopeLabel && (
                        <Typography variant="caption" color="text.secondary">
                          Alcance: {item.scopeLabel}
                        </Typography>
                      )}
                      {isSharedTab && item.shareNote && (
                        <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                          &ldquo;{item.shareNote}&rdquo;
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {item.questions?.length ?? 5} preguntas •{' '}
                        {isSharedTab ? 'Compartido el ' : 'Guardado el '}
                        {new Date(dateToShow).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button
                      component={RouterLink}
                      to={`/ai/quiz/${item.id}`}
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrowOutlinedIcon />}
                    >
                      {isSharedTab ? 'Abrir cuestionario' : hasScore ? 'Repasar' : 'Resolver'}
                    </Button>

                    {!isSharedTab && (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Compartir con amigos">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setShareTarget(item)}
                            aria-label="Compartir cuestionario con amigos"
                          >
                            <ShareOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar de Mi estudio">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(item)}
                            aria-label="Eliminar cuestionario de Mi estudio"
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Share Dialog */}
      <ShareAiDialog
        open={Boolean(shareTarget)}
        material={shareTarget}
        onClose={() => setShareTarget(null)}
        onShared={() =>
          setSnackbar({
            open: true,
            message: 'Contenido de IA compartido con tus amigos.',
            severity: 'success',
          })
        }
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(targetToDelete)}
        title="¿Eliminar cuestionario de Mi estudio?"
        message={`"${targetToDelete?.title}" será removido de tu lista personal de estudio. Podrás volver a generarlo cuando lo desees.`}
        confirmLabel="Eliminar"
        confirmColor="error"
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
