/**
 * @file AiStudyPage.jsx
 * @description View 19 — AI Study Generator (FE-20, BE-35).
 *
 * Generates automated academic quizzes from repositories and custom scopes.
 * Tracks daily quota, handles progress states and permanent disclaimer notices.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Alert,
  Autocomplete,
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

import { useAuth } from '../../context/authContext.js';
import {
  generateQuiz,
  getDailyAiQuota,
  getRepositories,
} from '../../services/index.js';

export default function AiStudyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRepoId = searchParams.get('repositoryId');
  const { user } = useAuth();

  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
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

    Promise.all([getRepositories({ size: 100 }), getDailyAiQuota()])
      .then(([reposData, quotaData]) => {
        if (!active) return;
        const repoList = Array.isArray(reposData) ? reposData : (reposData?.items ?? []);
        setRepositories(repoList);
        setQuota(quotaData);

        if (preselectedRepoId) {
          const found = repoList.find((r) => r.id === preselectedRepoId);
          if (found) setSelectedRepo(found);
        }
      })
      .catch((err) => {
        if (active) setGeneralError(err?.message || 'Error al cargar los datos.');
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
      const quiz = await generateQuiz({
        repositoryId: selectedRepo.id,
        scope,
        scopeValue,
      });

      // Navigate to Quiz resolution view (view 20)
      navigate(`/ai/quiz/${quiz.id}`);
    } catch (err) {
      setGeneralError(err?.message || 'Ocurrió un error al generar el cuestionario con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <SmartToyOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" component="h1" fontWeight={700}>
            Estudio con IA
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Genera cuestionarios de autoevaluación personalizados a partir de los apuntes y documentos de tus materias.
        </Typography>
      </Box>

      {/* Permanent AI Disclaimer Notice */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mb: 3, border: '1px solid', borderColor: 'primary.dark' }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Aviso sobre el uso de Inteligencia Artificial
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
          Las preguntas y explicaciones son generadas de forma automática por modelos de IA con fines de práctica y autoevaluación. Pueden contener errores o imprecisiones conceptuales.
        </Typography>
      </Alert>

      {/* Loading State */}
      {isLoading && (
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={280} />
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
                    Generando cuestionario con IA...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 2 }}>
                    Procesando apuntes, extrayendo conceptos clave y formulando preguntas con sus respectivas explicaciones.
                  </Typography>
                  <Chip
                    label={`Tiempo transcurrido: ${elapsedSeconds}s (máx. 60s)`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              ) : (
                <Box component="form" onSubmit={handleGenerate} noValidate>
                  <Stack spacing={3}>
                    {/* Repository Selector */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        1. Selecciona el repositorio de estudio
                      </Typography>
                      <Autocomplete
                        options={Array.isArray(repositories) ? repositories : []}
                        value={selectedRepo}
                        onChange={(_e, val) => setSelectedRepo(val)}
                        getOptionLabel={(option) => {
                          if (!option) return '';
                          if (typeof option === 'string') return option;
                          return `${option.name ?? ''} (${option.subject?.name ?? 'Materia'})`;
                        }}
                        isOptionEqualToValue={(option, value) => !value || option?.id === value?.id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Buscar repositorio..."
                            placeholder="Escribe el nombre de la materia o del repositorio"
                            required
                          />
                        )}
                        noOptionsText="No se encontraron repositorios"
                      />
                    </Box>

                    {/* Scope Selector */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        2. Alcance del cuestionario
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
                        Generar cuestionario con IA
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
