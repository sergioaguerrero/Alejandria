/**
 * @file MyStudyPage.jsx
 * @description View 21 — My Study & Shared AI Content (FE-22, FE-33, FE-34, BE-36, BE-37, BE-38).
 *
 * Organizes saved and shared AI study materials clearly by generation type
 * (Cuestionarios, Resúmenes, Guías de estudio, Diapositivas), with dedicated category
 * filter pills, grouped collapsible sections, subject filtering, and quick search.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SearchIcon from '@mui/icons-material/Search';
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
  AI_CONTENT_TYPES,
  getAiContentMeta,
  getAiMaterialRoute,
  getAiMaterialUnitLabel,
} from '../../utils/aiContentMeta.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';

function normalizeType(item) {
  const raw = String(item?.contentType || 'quiz').toLowerCase();
  return AI_CONTENT_TYPES.some((t) => t.value === raw) ? raw : 'quiz';
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Renders a single AI study material card with type-coded top accent.
 */
function StudyMaterialCard({ item, isSharedTab, onShare, onDelete }) {
  const contentType = normalizeType(item);
  const isQuiz = contentType === 'quiz';
  const typeMeta = getAiContentMeta(contentType);
  const hasScore = isQuiz && typeof item.lastScore === 'number';
  const scoreColor =
    item.lastScore >= 80 ? 'success' : item.lastScore >= 60 ? 'warning' : 'error';
  const dateToShow = isSharedTab ? item.sharedAt || item.createdAt : item.createdAt;

  return (
    <Card
      sx={(theme) => {
        const accent = theme.palette[typeMeta.colorKey]?.main ?? theme.palette.primary.main;
        return {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: 1,
          borderColor: 'divider',
          borderTop: `3px solid ${accent}`,
          borderRadius: 2.5,
          transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
            borderColor: alpha(accent, 0.5),
            borderTopColor: accent,
          },
        };
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
              sx={{ maxWidth: 155 }}
            />
          )}
        </Stack>

        <Typography
          variant="subtitle1"
          component="h3"
          fontWeight={700}
          sx={{
            mb: 1,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </Typography>

        <Stack spacing={0.65} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <FolderOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {item.repositoryName}
            </Typography>
          </Box>

          {(isSharedTab || isQuiz || item.scopeLabel) && (
            <Typography variant="caption" color="text.secondary">
              {isSharedTab || isQuiz
                ? `${item.subjectName || 'Materia'}${item.scopeLabel ? ` • ${item.scopeLabel}` : ''}`
                : item.scopeLabel}
            </Typography>
          )}

          {isSharedTab && item.shareNote && (
            <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
              &ldquo;{item.shareNote}&rdquo;
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            {getAiMaterialUnitLabel(item)} • {isSharedTab ? 'Compartido el ' : 'Guardado el '}
            {new Date(dateToShow).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Button
          component={RouterLink}
          to={getAiMaterialRoute(item)}
          variant="contained"
          size="small"
          startIcon={<PlayArrowOutlinedIcon />}
          sx={{ px: 2.25 }}
        >
          Abrir
        </Button>

        {!isSharedTab && (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Compartir con amigos">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onShare(item)}
                aria-label="Compartir material con amigos"
              >
                <ShareOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar de Mi estudio">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(item)}
                aria-label="Eliminar material de Mi estudio"
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </CardActions>
    </Card>
  );
}

export default function MyStudyPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [sharedMaterials, setSharedMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'shared'
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'quiz' | 'summary' | 'guide' | 'slides'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
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

  const isSharedTab = activeTab === 'shared';
  const baseMaterials = isSharedTab ? sharedMaterials : materials;

  // Subjects available in the current tab for quick filtering
  const availableSubjects = useMemo(() => {
    const names = new Set();
    baseMaterials.forEach((item) => {
      if (item.subjectName) names.add(item.subjectName);
    });
    return [...names].sort((a, b) => a.localeCompare(b, 'es'));
  }, [baseMaterials]);

  const effectiveSubject = availableSubjects.includes(selectedSubject) ? selectedSubject : 'all';

  // Items filtered by search + subject (used to compute live per-type counts)
  const searchAndSubjectFiltered = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    return baseMaterials.filter((item) => {
      if (effectiveSubject !== 'all' && item.subjectName !== effectiveSubject) {
        return false;
      }
      if (!q) return true;
      const haystack = normalizeText(
        [
          item.title,
          item.subjectName,
          item.repositoryName,
          item.scopeLabel,
          item.sharedBy,
        ].join(' '),
      );
      return haystack.includes(q);
    });
  }, [baseMaterials, effectiveSubject, searchQuery]);

  // Group filtered items into the 4 generation categories
  const groupedByType = useMemo(() => {
    const groups = Object.fromEntries(AI_CONTENT_TYPES.map((t) => [t.value, []]));
    for (const item of searchAndSubjectFiltered) {
      const type = normalizeType(item);
      groups[type].push(item);
    }
    return groups;
  }, [searchAndSubjectFiltered]);

  const sectionsToRender = useMemo(() => {
    if (selectedType === 'all') {
      return AI_CONTENT_TYPES.map((meta) => ({
        meta,
        items: groupedByType[meta.value] || [],
      })).filter((section) => section.items.length > 0);
    }
    const meta = getAiContentMeta(selectedType);
    return [{ meta, items: groupedByType[meta.value] || [] }];
  }, [selectedType, groupedByType]);

  const totalMatchingCount =
    selectedType === 'all'
      ? searchAndSubjectFiltered.length
      : (groupedByType[selectedType]?.length ?? 0);

  const hasActiveFilters =
    selectedType !== 'all' || effectiveSubject !== 'all' || searchQuery.trim() !== '';

  const handleToggleSection = (typeValue) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [typeValue]: !prev[typeValue],
    }));
  };

  const handleClearFilters = () => {
    setSelectedType('all');
    setSelectedSubject('all');
    setSearchQuery('');
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

  const selectedTypeMeta = selectedType !== 'all' ? getAiContentMeta(selectedType) : null;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
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
            Tus generaciones con IA organizadas por tipo: cuestionarios, resúmenes, guías de estudio y diapositivas.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={selectedType !== 'all' ? `/ai?type=${selectedType}` : '/ai'}
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
        >
          {selectedTypeMeta ? `Generar ${selectedTypeMeta.label.toLowerCase()}` : 'Generar con IA'}
        </Button>
      </Stack>

      {/* Primary Source Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, val) => {
            setActiveTab(val);
            setSelectedSubject('all');
          }}
          aria-label="Secciones de Mi estudio"
        >
          <Tab value="mine" label={`Guardados por mí (${materials.length})`} />
          <Tab value="shared" label={`Compartidos conmigo (${sharedMaterials.length})`} />
        </Tabs>
      </Box>

      {/* Category Filter Bar + Search + Subject Filter */}
      {!isLoading && !errorMessage && baseMaterials.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.75, sm: 2.25 },
            mb: 3,
            borderRadius: 2.5,
          }}
        >
          <Stack spacing={2}>
            {/* Category Pills by AI Generation Type */}
            <Stack
              direction="row"
              useFlexGap
              spacing={1}
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <Chip
                clickable
                icon={<AppsOutlinedIcon fontSize="small" />}
                label={`Todos (${searchAndSubjectFiltered.length})`}
                color={selectedType === 'all' ? 'primary' : 'default'}
                variant={selectedType === 'all' ? 'filled' : 'outlined'}
                onClick={() => setSelectedType('all')}
                sx={{ fontWeight: 600 }}
              />

              {AI_CONTENT_TYPES.map((typeMeta) => {
                const count = groupedByType[typeMeta.value]?.length ?? 0;
                const isSelected = selectedType === typeMeta.value;
                return (
                  <Chip
                    key={typeMeta.value}
                    clickable
                    icon={<AiTypeIcon type={typeMeta.value} fontSize="small" />}
                    label={`${typeMeta.pluralLabel} (${count})`}
                    color={isSelected ? typeMeta.colorKey : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => setSelectedType(typeMeta.value)}
                    sx={{
                      fontWeight: 600,
                      opacity: count === 0 && !isSelected ? 0.65 : 1,
                    }}
                  />
                );
              })}
            </Stack>

            {/* Quick Search + Optional Subject Filter */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar por título, materia o repositorio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Limpiar búsqueda"
                          onClick={() => setSearchQuery('')}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />

              {availableSubjects.length > 1 && (
                <TextField
                  select
                  size="small"
                  label="Materia"
                  value={effectiveSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  sx={{ minWidth: { xs: '100%', sm: 240 } }}
                  slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
                >
                  <MenuItem value="all">Todas las materias</MenuItem>
                  {availableSubjects.map((subjectName) => (
                    <MenuItem key={subjectName} value={subjectName}>
                      {subjectName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

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
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2.5 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State: Nothing saved/shared at all */}
      {!isLoading && !errorMessage && baseMaterials.length === 0 && (
        isSharedTab ? (
          <EmptyState
            icon={PeopleOutlinedIcon}
            title="Aún no han compartido contenido de IA contigo"
            description="Cuando alguno de tus amigos mutuos comparta un material de IA contigo, aparecerá aquí organizado por tipo."
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

      {/* Empty State: Active category or search filter has 0 matches */}
      {!isLoading && !errorMessage && baseMaterials.length > 0 && totalMatchingCount === 0 && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2.5, textAlign: 'center' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 460, mx: 'auto' }}>
            {selectedTypeMeta ? (
              <Box
                sx={(theme) => {
                  const accent =
                    theme.palette[selectedTypeMeta.colorKey]?.main ?? theme.palette.primary.main;
                  return {
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(accent, 0.12),
                    color: accent,
                  };
                }}
              >
                <AiTypeIcon type={selectedTypeMeta.value} sx={{ fontSize: 28 }} />
              </Box>
            ) : (
              <SearchIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            )}

            <Typography variant="h6" fontWeight={700}>
              {selectedTypeMeta && !searchQuery.trim() && effectiveSubject === 'all'
                ? isSharedTab
                  ? `No tienes ${selectedTypeMeta.pluralLabel.toLowerCase()} compartidos`
                  : `Aún no tienes ${selectedTypeMeta.pluralLabel.toLowerCase()} guardados`
                : 'No encontramos materiales con esos filtros'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {selectedTypeMeta && !searchQuery.trim() && effectiveSubject === 'all'
                ? selectedTypeMeta.description
                : 'Prueba limpiando la búsqueda o cambiando la categoría seleccionada.'}
            </Typography>

            <Stack direction="row" spacing={1.25} sx={{ pt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {hasActiveFilters && (
                <Button variant="outlined" size="small" onClick={handleClearFilters}>
                  Ver todo el estudio
                </Button>
              )}
              {!isSharedTab && selectedTypeMeta && (
                <Button
                  component={RouterLink}
                  to={`/ai?type=${selectedTypeMeta.value}`}
                  variant="contained"
                  size="small"
                  startIcon={<AutoAwesomeIcon />}
                >
                  {selectedTypeMeta.submitLabel}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Organized Sections by Generation Type */}
      {!isLoading && !errorMessage && totalMatchingCount > 0 && (
        <Stack spacing={3.5}>
          {sectionsToRender.map(({ meta, items }) => {
            const isGroupedOverview = selectedType === 'all';
            const isCollapsed = isGroupedOverview && Boolean(collapsedSections[meta.value]);

            return (
              <Box key={meta.value}>
                {/* Section Header */}
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    mb: isCollapsed ? 0 : 2,
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={(theme) => {
                        const accent =
                          theme.palette[meta.colorKey]?.main ?? theme.palette.primary.main;
                        return {
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(accent, 0.14),
                          color: accent,
                          flexShrink: 0,
                        };
                      }}
                    >
                      <AiTypeIcon type={meta.value} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="h6" component="h2" fontWeight={700}>
                          {meta.pluralLabel}
                        </Typography>
                        <Chip
                          size="small"
                          color={meta.colorKey}
                          variant="outlined"
                          label={`${items.length} ${items.length === 1 ? 'material' : 'materiales'}`}
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {meta.description}
                      </Typography>
                    </Box>
                  </Stack>

                  {isGroupedOverview && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setSelectedType(meta.value)}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' }, textTransform: 'none' }}
                      >
                        Ver solo {meta.pluralLabel.toLowerCase()}
                      </Button>
                      <Tooltip title={isCollapsed ? 'Expandir sección' : 'Contraer sección'}>
                        <IconButton
                          size="small"
                          aria-label={isCollapsed ? `Expandir ${meta.pluralLabel}` : `Contraer ${meta.pluralLabel}`}
                          onClick={() => handleToggleSection(meta.value)}
                        >
                          {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>

                <Collapse in={!isCollapsed} timeout="auto">
                  <Grid container spacing={2.5}>
                    {items.map((item) => (
                      <Grid key={item.shareId || item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <StudyMaterialCard
                          item={item}
                          isSharedTab={isSharedTab}
                          onShare={setShareTarget}
                          onDelete={setTargetToDelete}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>

                {isGroupedOverview && <Divider sx={{ mt: 3 }} />}
              </Box>
            );
          })}
        </Stack>
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
        onClose={() => !isDeleting && setTargetToDelete(null)}
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
