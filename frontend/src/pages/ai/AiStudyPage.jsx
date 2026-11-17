/**
 * @file AiStudyPage.jsx
 * @description View 19 — AI Study Generator (FE-20, BE-35).
 *
 * Generates automated academic quizzes from followed study repositories.
 * Students only see their followed and owned repositories by default, avoiding
 * searching through thousands of unrelated courses, with an optional catalog search.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

import AiTypeIcon from '../../components/ai/AiTypeIcon.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import {
  AI_CONTENT_TYPES,
  getAiContentMeta,
  getAiMaterialRoute,
} from '../../utils/aiContentMeta.js';
import { useAuth } from '../../context/authContext.js';
import {
  generateAiMaterial,
  getDailyAiQuota,
  getFollowedRepositories,
  getRepositoriesByUser,
  getRepository,
} from '../../services/index.js';

export default function AiStudyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRepoId = searchParams.get('repositoryId');
  const { user } = useAuth();

  // Repository states
  const [followedRepos, setFollowedRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [contentType, setContentType] = useState('quiz');
  const [quota, setQuota] = useState({ total: 5, used: 0, remaining: 5 });

  // Scope state
  const [scope, setScope] = useState('all'); // 'all' | 'term' | 'topic' | 'tag'
  const [termValue, setTermValue] = useState(1);
  const [topicValue, setTopicValue] = useState('');
  const [tagValue, setTagValue] = useState('');

  // Execution state
  const [loadedKey, setLoadedKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generalError, setGeneralError] = useState('');

  const isLoading = !user || loadedKey !== user.username;

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    Promise.all([
      getFollowedRepositories(),
      getRepositoriesByUser(user.username),
      getDailyAiQuota(),
    ])
      .then(async ([followedList, userRepos, quotaData]) => {
        if (!active) return;

        // Merge followed and authored repositories (deduplicating by id)
        const repoMap = new Map();
        [...followedList, ...userRepos].forEach((repo) => {
          if (repo && repo.id != null) repoMap.set(String(repo.id), repo);
        });

        // Include preselected repository from /repositories/:id even if not followed yet
        if (preselectedRepoId && !repoMap.has(String(preselectedRepoId))) {
          const directRepo = await getRepository(preselectedRepoId).catch(() => null);
          if (directRepo && directRepo.id != null) {
            repoMap.set(String(directRepo.id), directRepo);
          }
        }

        if (!active) return;
        const myStudyList = Array.from(repoMap.values());
        setFollowedRepos(myStudyList);
        setQuota(quotaData);

        // Pre-selection strategy
        if (preselectedRepoId) {
          const found = myStudyList.find((r) => String(r.id) === String(preselectedRepoId));
          if (found) {
            setSelectedRepo(found);
          }
        } else if (myStudyList.length > 0) {
          // Select first followed repo by default for instant 1-click readiness
          setSelectedRepo(myStudyList[0]);
        }
      })
      .catch((err) => {
        if (!active) return;
        setGeneralError(err?.message || 'Error al cargar los datos de estudio.');
      })
      .finally(() => {
        if (active) setLoadedKey(user.username);
      });

    return () => {
      active = false;
    };
  }, [user, preselectedRepoId]);

  // Generation timer (up to 60 seconds)
  useEffect(() => {
    if (!isGenerating) return undefined;

    const interval = setInterval(() => {
      setElapsedSeconds((sec) => {
        if (sec >= 60) {
          clearInterval(interval);
          setIsGenerating(false);
          setGeneralError('El tiempo de generación se agotó (máximo 60 segundos). Por favor intenta con un alcance menor.');
          return 0;
        }
        return sec + 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isGenerating]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!selectedRepo) {
      setGeneralError('Selecciona un repositorio para comenzar.');
      return;
    }

    if (quota.remaining <= 0) {
      setGeneralError('Has consumido tus 5 generaciones disponibles por hoy. Vuelve mañana.');
      return;
    }

    let scopeValue = null;
    if (scope === 'term') scopeValue = termValue;
    else if (scope === 'topic') scopeValue = topicValue.trim() || 'General';
    else if (scope === 'tag') scopeValue = tagValue.trim() || 'General';

    setIsGenerating(true);
    setElapsedSeconds(0);

    try {
      const material = await generateAiMaterial({
        contentType,
        repositoryId: selectedRepo.id,
        scope,
        scopeValue,
      });

      // Navigate to Quiz resolution view (view 20)
      navigate(getAiMaterialRoute(material));
    } catch (err) {
      setGeneralError(err?.message || 'Ocurrió un error al generar el contenido con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <SmartToyOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" component="h1" fontWeight={700}>
            Estudio con IA
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Genera cuestionarios, resúmenes, guías de estudio y diapositivas personalizadas a partir de los apuntes de tus materias seguidas.
        </Typography>
      </Box>

      {/* Permanent AI Disclaimer Notice */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mb: 3, border: 1, borderColor: 'primary.dark' }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Aviso sobre el uso de Inteligencia Artificial
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
          Las preguntas y explicaciones son generadas de forma automática por modelos de IA con fines de práctica y autoevaluación. Pueden contener imprecisiones conceptuales.
        </Typography>
      </Alert>

      {/* Loading State */}
      {isLoading && (
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
        </Stack>
      )}

      {!isLoading && (
        <Stack spacing={3}>
          {/* Daily Quota Card */}
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Cuota de generaciones de hoy
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Límite diario para garantizar disponibilidad del servicio
                  </Typography>
                </Box>
                <Chip
                  color={quota.remaining > 0 ? 'primary' : 'error'}
                  label={`${quota.remaining} de ${quota.total} disponibles hoy`}
                  size="small"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={(quota.used / quota.total) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>

          {/* Generator Form */}
          <Card variant="outlined">
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              {generalError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {generalError}
                </Alert>
              )}

              {isGenerating ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress size={48} sx={{ mb: 3 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {getAiContentMeta(contentType).generatingTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 2 }}>
                    {getAiContentMeta(contentType).generatingSubtitle}
                  </Typography>
                  <Chip
                    label={`Tiempo transcurrido: ${elapsedSeconds}s (máx. 60s)`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              ) : (
                <Box component="form" onSubmit={handleGenerate} noValidate>
                  <Stack spacing={3.5}>
                    {/* 1. Content Type Selector (FE-34) */}
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          1. Tipo de contenido a generar
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Elige el formato de estudio que deseas crear con Inteligencia Artificial.
                        </Typography>
                      </Box>

                      <Grid container spacing={1.5}>
                        {AI_CONTENT_TYPES.map((typeOption) => {
                          const isSelected = contentType === typeOption.value;
                          return (
                            <Grid key={typeOption.value} size={{ xs: 12, sm: 6 }}>
                              <Box
                                role="button"
                                tabIndex={0}
                                onClick={() => setContentType(typeOption.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setContentType(typeOption.value);
                                  }
                                }}
                                sx={{
                                  p: 2,
                                  height: '100%',
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  border: 2,
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                  transition: 'all 0.15s ease-in-out',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                                  },
                                }}
                              >
                                <Stack
                                  direction="row"
                                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
                                >
                                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <AiTypeIcon
                                      type={typeOption.value}
                                      color={isSelected ? 'primary' : 'action'}
                                      fontSize="small"
                                    />
                                    <Typography variant="subtitle2" fontWeight={700}>
                                      {typeOption.label}
                                    </Typography>
                                  </Stack>
                                  {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {typeOption.description}
                                </Typography>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>

                    {/* 2. Repository Selector — Option A: Followed Study Repositories */}
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          2. Repositorios de estudio que sigues
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Selecciona una de las materias que estás cursando para autoevaluarte en 1 clic.
                        </Typography>
                      </Box>

                      {followedRepos.length > 0 ? (
                        <Grid container spacing={2}>
                          {followedRepos.map((repo) => {
                            const isSelected = selectedRepo?.id === repo.id;
                            const isOwner = repo.authorUsername === user?.username;

                            return (
                              <Grid key={repo.id} size={{ xs: 12, sm: 6 }}>
                                <Box
                                  onClick={() => setSelectedRepo(repo)}
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    border: 2,
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                    transition: 'all 0.15s ease-in-out',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                      bgcolor: isSelected ? 'action.selected' : 'action.hover',
                                      transform: 'translateY(-2px)',
                                    },
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
                                  >
                                    <Chip
                                      size="small"
                                      color="primary"
                                      variant={isSelected ? 'filled' : 'outlined'}
                                      label={repo.subject?.name ?? 'Materia'}
                                      sx={{ maxWidth: 220 }}
                                    />
                                    {isSelected ? (
                                      <CheckCircleIcon color="primary" fontSize="small" />
                                    ) : (
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        icon={<BookmarkAddedIcon fontSize="small" />}
                                        label={isOwner ? 'Creado por ti' : 'Siguiendo'}
                                        sx={{ fontSize: '0.75rem', height: 22 }}
                                      />
                                    )}
                                  </Stack>

                                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                    {repo.name}
                                  </Typography>

                                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <FolderOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {repo.documentCount ?? 0} documentos • @{repo.authorUsername}
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <EmptyState
                          icon={BookmarkAddOutlinedIcon}
                          title="Aún no sigues ningún repositorio de estudio"
                          description="Sigue los repositorios de las materias que estás cursando para tenerlos aquí siempre a mano y generar evaluaciones automáticas en 1 clic."
                          action={
                            <Button
                              component={RouterLink}
                              to="/search"
                              variant="contained"
                              startIcon={<ExploreOutlinedIcon />}
                            >
                              Explorar repositorios
                            </Button>
                          }
                        />
                      )}


                    </Box>

                    {/* Selected Repository Confirmation pill */}
                    {selectedRepo && (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          border: 1,
                          borderColor: 'primary.dark',
                          bgcolor: 'action.selected',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <AutoAwesomeIcon color="primary" fontSize="small" />
                          <Typography variant="body2">
                            Materia seleccionada: <strong>{selectedRepo.name}</strong> ({selectedRepo.subject?.name ?? 'General'})
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    {/* 2. Scope Selector */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        3. Alcance del contenido
                      </Typography>
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                        >
                          <Grid container spacing={1}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <FormControlLabel
                                value="all"
                                control={<Radio size="small" />}
                                label="Todo el repositorio"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <FormControlLabel
                                value="term"
                                control={<Radio size="small" />}
                                label="Por corte académico"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <FormControlLabel
                                value="topic"
                                control={<Radio size="small" />}
                                label="Por tema específico"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <FormControlLabel
                                value="tag"
                                control={<Radio size="small" />}
                                label="Por etiqueta"
                              />
                            </Grid>
                          </Grid>
                        </RadioGroup>
                      </FormControl>
                    </Box>

                    {/* Conditional Scope Inputs */}
                    {scope === 'term' && (
                      <FormControl fullWidth size="small">
                        <FormLabel sx={{ mb: 1, fontSize: '0.85rem' }}>Elige el corte:</FormLabel>
                        <Select
                          value={termValue}
                          onChange={(e) => setTermValue(Number(e.target.value))}
                        >
                          <MenuItem value={1}>Corte 1</MenuItem>
                          <MenuItem value={2}>Corte 2</MenuItem>
                          <MenuItem value={3}>Corte 3</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    {scope === 'topic' && (
                      <TextField
                        size="small"
                        label="Tema a evaluar"
                        placeholder="Ej. Árboles AVL, Grafos, Normalización SQL..."
                        value={topicValue}
                        onChange={(e) => setTopicValue(e.target.value)}
                        helperText="La IA focalizará las preguntas en los documentos relacionados a este tema."
                        fullWidth
                      />
                    )}

                    {scope === 'tag' && (
                      <TextField
                        size="small"
                        label="Etiqueta"
                        placeholder="Ej. parcial, taller, algoritmos..."
                        value={tagValue}
                        onChange={(e) => setTagValue(e.target.value)}
                        helperText="Filtra los documentos etiquetados con este término."
                        fullWidth
                      />
                    )}

                    {/* Submit Button */}
                    <Box sx={{ pt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<AutoAwesomeIcon />}
                        disabled={!selectedRepo || quota.remaining <= 0}
                      >
                        {getAiContentMeta(contentType).submitLabel}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
