/**
 * @file AiMaterialPage.jsx
 * @description Result view for AI-generated summaries, study guides, and slides (FE-34, FE-33, BE-37).
 *
 * Displays structured summaries, step-by-step study guides with interactive checklists,
 * and navigable slide decks, with support for saving to "Mi estudio" and sharing
 * exclusively with mutual friends.
 */

import { useState, useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import BookmarkOutlinedIcon from '@mui/icons-material/BookmarkOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined';
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

import AiTypeIcon from '../../components/ai/AiTypeIcon.jsx';
import ShareAiDialog from '../../components/ai/ShareAiDialog.jsx';
import {
  getAiMaterialById,
  toggleSaveAiMaterialToMyStudy,
} from '../../services/index.js';
import { getAiContentMeta } from '../../utils/aiContentMeta.js';

export default function AiMaterialPage() {
  const { id } = useParams();

  const [material, setMaterial] = useState(null);
  const [loadedId, setLoadedId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [savedInMyStudy, setSavedInMyStudy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Interactive UI state for study guide checklist & slides presentation
  const [checkedItems, setCheckedItems] = useState({});
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const isLoading = !loadedId || loadedId !== id;

  useEffect(() => {
    let active = true;

    getAiMaterialById(id)
      .then((data) => {
        if (!active) return;
        setMaterial(data);
        setSavedInMyStudy(Boolean(data.savedInMyStudy));
        setActiveSlideIndex(0);
        setCheckedItems({});
        setErrorMessage('');
      })
      .catch((err) => {
        if (!active) return;
        setMaterial(null);
        setErrorMessage(err?.message || 'No se pudo cargar el material generado.');
      })
      .finally(() => {
        if (active) setLoadedId(id);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleToggleSave = async () => {
    if (!material || isSaving) return;
    setIsSaving(true);
    const nextState = !savedInMyStudy;

    try {
      await toggleSaveAiMaterialToMyStudy(material.id, nextState);
      setSavedInMyStudy(nextState);
      setSnackbar({
        open: true,
        message: nextState
          ? 'Material guardado en "Mi estudio".'
          : 'Material removido de "Mi estudio".',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'No se pudo actualizar Mi estudio.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (errorMessage || !material) {
    return (
      <Box sx={{ maxWidth: 680, mx: 'auto', py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage || 'Material no encontrado.'}
        </Alert>
        <Button
          component={RouterLink}
          to="/ai"
          startIcon={<ArrowBackOutlinedIcon />}
          variant="outlined"
        >
          Volver a Estudio con IA
        </Button>
      </Box>
    );
  }

  const typeMeta = getAiContentMeta(material.contentType);
  const slides = material.slides || [];
  const currentSlide = slides[activeSlideIndex] || slides[0] || null;
  const slideProgress = slides.length > 0 ? ((activeSlideIndex + 1) / slides.length) * 100 : 0;

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      {/* Top Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2, gap: 1.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            component={RouterLink}
            to="/ai"
            startIcon={<ArrowBackOutlinedIcon />}
            size="small"
            color="inherit"
          >
            Generador de IA
          </Button>
          <Button
            component={RouterLink}
            to="/ai/my-study"
            startIcon={<SchoolOutlinedIcon />}
            size="small"
            color="inherit"
          >
            Mi estudio
          </Button>
        </Stack>

        <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            size="small"
            color="secondary"
            icon={<AiTypeIcon type={material.contentType} fontSize="small" />}
            label={typeMeta.label}
          />
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={material.subjectName || 'Materia'}
          />
          {material.scopeLabel && (
            <Chip size="small" variant="outlined" label={material.scopeLabel} />
          )}
        </Stack>
      </Stack>

      {/* Shared banner when opened from mutual friend */}
      {material.isSharedWithMe && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Compartido contigo por <strong>@{material.sharedBy}</strong>
          {material.shareNote ? ` — "${material.shareNote}"` : ''}
        </Alert>
      )}

      {/* Header Card */}
      <Card sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}
          >
            <Box>
              <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
                {material.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Repositorio: <strong>{material.repositoryName}</strong> •{' '}
                {new Date(material.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Typography>
            </Box>

            {material.isSharedWithMe ? (
              <Chip
                color="info"
                variant="outlined"
                label={`Compartido por @${material.sharedBy}`}
                sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, fontWeight: 600 }}
              />
            ) : (
              <Stack
                direction="row"
                useFlexGap
                spacing={1}
                sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, flexWrap: 'wrap' }}
              >
                <Button
                  variant={savedInMyStudy ? 'contained' : 'outlined'}
                  color={savedInMyStudy ? 'primary' : 'inherit'}
                  size="small"
                  startIcon={savedInMyStudy ? <BookmarkOutlinedIcon /> : <BookmarkBorderOutlinedIcon />}
                  onClick={handleToggleSave}
                  disabled={isSaving}
                >
                  {savedInMyStudy ? 'En Mi estudio' : 'Guardar en Mi estudio'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<ShareOutlinedIcon />}
                  onClick={() => setShareOpen(true)}
                >
                  Compartir con amigos
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Content View 1: Summary */}
      {material.contentType === 'summary' && (
        <Stack spacing={2.5}>
          {material.overview && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <AiTypeIcon type="summary" color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Síntesis general
                  </Typography>
                  {material.estimatedReadMinutes && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${material.estimatedReadMinutes} min lectura`}
                    />
                  )}
                </Stack>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {material.overview}
                </Typography>
              </CardContent>
            </Card>
          )}

          {(material.sections || []).map((section, idx) => (
            <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {section.heading}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                  {section.body}
                </Typography>
                {section.keyPoints?.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Puntos clave
                    </Typography>
                    <Stack spacing={0.75}>
                      {section.keyPoints.map((pt, pIdx) => (
                        <Typography key={pIdx} variant="body2">
                          • {pt}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}

          {material.keyConcepts?.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Glosario de conceptos clave
              </Typography>
              <Grid container spacing={2}>
                {material.keyConcepts.map((concept, idx) => (
                  <Grid key={idx} size={{ xs: 12, sm: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                        {concept.term}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {concept.definition}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Stack>
      )}

      {/* Content View 2: Study Guide */}
      {material.contentType === 'guide' && (
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Propósito de la guía
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                {material.introduction}
              </Typography>
              {material.objectives?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Objetivos de aprendizaje
                  </Typography>
                  <Stack spacing={1}>
                    {material.objectives.map((obj, idx) => (
                      <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <CheckCircleOutlinedIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
                        <Typography variant="body2">{obj}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>

          {(material.modules || []).map((mod, idx) => (
            <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {mod.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {mod.summary}
                </Typography>

                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  {(mod.keyTakeaways || []).map((tk, tIdx) => (
                    <Typography key={tIdx} variant="body2">
                      • {tk}
                    </Typography>
                  ))}
                </Stack>

                {mod.practicePrompt && (
                  <Alert
                    severity="info"
                    icon={<TipsAndUpdatesOutlinedIcon />}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      Actividad sugerida
                    </Typography>
                    <Typography variant="body2">{mod.practicePrompt}</Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}

          {material.checklist?.length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Checklist de preparación
                </Typography>
                <Stack>
                  {material.checklist.map((item, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={
                        <Checkbox
                          checked={Boolean(checkedItems[idx])}
                          onChange={(e) =>
                            setCheckedItems((prev) => ({ ...prev, [idx]: e.target.checked }))
                          }
                        />
                      }
                      label={item}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {/* Content View 3: Presentation Slides */}
      {material.contentType === 'slides' && currentSlide && (
        <Stack spacing={2.5}>
          {material.subtitle && (
            <Typography variant="body2" color="text.secondary">
              {material.subtitle}
            </Typography>
          )}

          <Box>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Diapositiva {activeSlideIndex + 1} de {slides.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(slideProgress)}% revisado
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={slideProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Main Slide Stage */}
          <Card
            sx={{
              border: 2,
              borderColor: 'primary.main',
              borderRadius: 3,
              minHeight: 330,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
              >
                <Chip
                  size="small"
                  color="primary"
                  label={`Lámina ${currentSlide.slideNumber ?? activeSlideIndex + 1}`}
                />
                <Typography variant="caption" color="text.secondary">
                  {material.subjectName}
                </Typography>
              </Stack>

              <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
                {currentSlide.title}
              </Typography>
              {currentSlide.subtitle && (
                <Typography variant="subtitle1" color="primary" fontWeight={600} sx={{ mb: 2.5 }}>
                  {currentSlide.subtitle}
                </Typography>
              )}

              <Stack spacing={1.25} sx={{ mb: 3 }}>
                {(currentSlide.bulletPoints || []).map((point, idx) => (
                  <Stack key={idx} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mt: 1,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body1">{point}</Typography>
                  </Stack>
                ))}
              </Stack>

              {currentSlide.takeaway && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'action.selected',
                    borderLeft: 4,
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="primary" display="block">
                    IDEA CLAVE
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {currentSlide.takeaway}
                  </Typography>
                </Box>
              )}
            </CardContent>

            {currentSlide.speakerNotes && (
              <Box sx={{ px: { xs: 2.5, sm: 4 }, py: 1.5, bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Notas de exposición:</strong> {currentSlide.speakerNotes}
                </Typography>
              </Box>
            )}
          </Card>

          {/* Navigation Controls & Slide Strip */}
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeOutlinedIcon />}
              onClick={() => setActiveSlideIndex((idx) => Math.max(0, idx - 1))}
              disabled={activeSlideIndex === 0}
            >
              Anterior
            </Button>
            <Button
              variant="contained"
              endIcon={<NavigateNextOutlinedIcon />}
              onClick={() => setActiveSlideIndex((idx) => Math.min(slides.length - 1, idx + 1))}
              disabled={activeSlideIndex >= slides.length - 1}
            >
              Siguiente
            </Button>
          </Stack>

          <Grid container spacing={1.5}>
            {slides.map((s, idx) => {
              const isActive = idx === activeSlideIndex;
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper
                    variant="outlined"
                    onClick={() => setActiveSlideIndex(idx)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive ? 'primary.main' : 'divider',
                      bgcolor: isActive ? 'action.selected' : 'background.paper',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  >
                    <Typography variant="caption" color="primary" fontWeight={700}>
                      Lámina {idx + 1}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {s.title}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      )}

      {/* AI Disclaimer */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mt: 3, mb: 4, borderRadius: 2 }}
      >
        Este contenido fue generado automáticamente por modelos de IA a partir de los documentos del
        repositorio seleccionado. Verifica conceptos críticos con tus apuntes de clase.
      </Alert>

      {/* Share with mutual friends dialog */}
      <ShareAiDialog
        open={shareOpen}
        material={material}
        onClose={() => setShareOpen(false)}
        onShared={() =>
          setSnackbar({
            open: true,
            message: 'Contenido de IA compartido con tus amigos.',
            severity: 'success',
          })
        }
      />

      {/* Snackbar alerts */}
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
