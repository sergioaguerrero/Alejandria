/**
 * @file MyStudyPage.jsx
 * @description View 21 — My Study & Shared AI Content (FE-22, FE-33, FE-34, BE-36, BE-37, BE-38).
 *
 * Displays saved AI materials (quizzes, summaries, study guides, slides) and AI materials
 * shared by mutual friends, allowing students to reopen content, share their own AI study
 * items exclusively with mutual friends, and remove saved entries.
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

import AiTypeIcon from '../../components/ai/AiTypeIcon.jsx';
import ShareAiDialog from '../../components/ai/ShareAiDialog.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  deleteFromMyStudy,
  getMyStudyMaterials,
  getSharedWithMeAiMaterials,
} from '../../services/index.js';
import {
  getAiContentMeta,
  getAiMaterialRoute,
  getAiMaterialUnitLabel,
} from '../../utils/aiContentMeta.js';

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
        message: 'Material eliminado de Mi estudio.',
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
            Consulta y repasa tus cuestionarios, resúmenes, guías y diapositivas guardadas o compartidas por amigos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            component={RouterLink}
            to="/ai"
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
          >
            Generar con IA
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
            description="Genera cuestionarios, resúmenes, guías de estudio o diapositivas con IA y guárdalos para repasar antes de tus exámenes."
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
            const contentType = item.contentType || 'quiz';
            const isQuiz = contentType === 'quiz';
            const typeMeta = getAiContentMeta(contentType);
            const hasScore = isQuiz && typeof item.lastScore === 'number';
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
                      useFlexGap
                      spacing={0.75}
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        mb: 1.5,
                      }}
                    >
                      <Chip
                        size="small"
                        color={typeMeta.colorKey}
                        variant="outlined"
                        icon={<AiTypeIcon type={contentType} fontSize="small" />}
                        label={typeMeta.shortLabel}
                      />
                      {isSharedTab ? (
                        <Chip
                          size="small"
                          color="info"
                          variant="outlined"
                          label={`@${item.sharedBy}`}
                          sx={{ fontWeight: 600 }}
                        />
                      ) : isQuiz ? (
                        hasScore ? (
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
                        )
                      ) : (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={item.subjectName || 'Materia'}
                          sx={{ maxWidth: 145 }}
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
                      <Typography variant="caption" color="text.secondary">
                        {item.subjectName || 'Materia'}
                        {item.scopeLabel ? ` • ${item.scopeLabel}` : ''}
                      </Typography>
                      {isSharedTab && item.shareNote && (
                        <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                          &ldquo;{item.shareNote}&rdquo;
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {getAiMaterialUnitLabel(item)} •{' '}
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
                      to={getAiMaterialRoute(item)}
                      variant="contained"
                      size="small"
                      sx={{
                        position: 'relative',
                        justifyContent: 'center',
                        px: 4.5,
                        py: 1,
                        lineHeight: 1.2,
                      }}
                    >
                      <PlayArrowOutlinedIcon
                        aria-hidden="true"
                        sx={{
                          position: 'absolute',
                          left: 12,
                          fontSize: 18,
                        }}
                      />
                      Abrir
                    </Button>

                    {!isSharedTab && (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Compartir con amigos">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setShareTarget(item)}
                            aria-label="Compartir material con amigos"
                          >
                            <ShareOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar de Mi estudio">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(item)}
                            aria-label="Eliminar material de Mi estudio"
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
        title="¿Eliminar material de Mi estudio?"
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
