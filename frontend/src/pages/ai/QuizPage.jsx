/**
 * @file QuizPage.jsx
 * @description View 20 — AI Quiz Resolution (FE-21, BE-36).
 *
 * Provides a stepped quiz interface with progress tracking, immediate scoring,
 * question-by-question academic feedback with AI explanations, retry flow,
 * and saving to "Mi estudio".
 */

import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined';
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

import {
  getQuizById,
  submitQuizAnswers,
  toggleSaveQuizToMyStudy,
} from '../../services/index.js';

import DownloadAiPdfButton from '../../components/ai/DownloadAiPdfButton.jsx';
import SaveAiStudyButton from '../../components/ai/SaveAiStudyButton.jsx';
import ShareAiDialog from '../../components/ai/ShareAiDialog.jsx';

export default function QuizPage() {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loadedId, setLoadedId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Questionnaire interactive state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIndex]: optionIndex }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedInMyStudy, setSavedInMyStudy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Snackbar feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isLoading = !quiz || loadedId !== id;

  useEffect(() => {
    let active = true;

    getQuizById(id)
      .then((data) => {
        if (!active) return;
        setQuiz(data);
        setSavedInMyStudy(Boolean(data.savedInMyStudy));
        setLoadedId(id);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(err?.message || 'No se pudo cargar el cuestionario.');
        setLoadedId(id);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;

  const handleSelectOption = (optionIndex) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });
    return {
      correctCount,
      total: totalQuestions,
      scorePercentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { scorePercentage } = calculateScore();

    try {
      await submitQuizAnswers(id, { score: scorePercentage });
      setIsSubmitted(true);
      setCurrentIndex(0);
      setSnackbar({
        open: true,
        message: '¡Cuestionario completado! Revisa tus resultados y justificaciones.',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'Error al registrar las respuestas.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
  };

  const handleToggleSave = async () => {
    setIsSaving(true);
    const nextSaved = !savedInMyStudy;
    try {
      await toggleSaveQuizToMyStudy(id, nextSaved);
      setSavedInMyStudy(nextSaved);
      setSnackbar({
        open: true,
        message: nextSaved
          ? 'Guardado en Mi estudio exitosamente.'
          : 'Eliminado de Mi estudio.',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'Error al actualizar Mi estudio.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 860, mx: 'auto', py: 2 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (errorMessage || !quiz) {
    return (
      <Box sx={{ maxWidth: 860, mx: 'auto', py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage || 'Cuestionario no encontrado.'}
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

  const { correctCount, scorePercentage } = calculateScore();
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      {/* Top back navigation & metadata */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2, gap: 1 }}
      >
        <Button
          component={RouterLink}
          to="/ai"
          startIcon={<ArrowBackOutlinedIcon />}
          size="small"
          color="inherit"
        >
          Generador de IA
        </Button>

        <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {!quiz.isSharedWithMe && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<ShareOutlinedIcon />}
              onClick={() => setShareOpen(true)}
            >
              Compartir con amigos
            </Button>
          )}
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={quiz.subjectName || 'Materia'}
          />
          {quiz.scopeLabel && (
            <Chip size="small" variant="outlined" label={quiz.scopeLabel} />
          )}
        </Stack>
      </Stack>

      {quiz.isSharedWithMe && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Compartido contigo por <strong>@{quiz.sharedBy}</strong>
          {quiz.shareNote ? ` — "${quiz.shareNote}"` : ''}
        </Alert>
      )}

      {/* Main Header Card */}
      <Card sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}
          >
            <Box sx={{ minWidth: 0, flex: '1 1 240px' }}>
              <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
                {quiz.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Repositorio: <strong>{quiz.repositoryName}</strong> • {totalQuestions} preguntas generadas
              </Typography>
            </Box>

            <Stack
              spacing={1}
              sx={{
                width: { xs: '100%', sm: 170 },
                alignSelf: { xs: 'stretch', sm: 'center' },
                flexShrink: 0,
              }}
            >
              <DownloadAiPdfButton
                fullWidth
                material={{ ...quiz, contentType: 'quiz' }}
                onDownloaded={() =>
                  setSnackbar({
                    open: true,
                    message: 'Cuestionario descargado en formato PDF.',
                    severity: 'success',
                  })
                }
                onError={(err) =>
                  setSnackbar({
                    open: true,
                    message: err?.message || 'No se pudo generar el archivo PDF.',
                    severity: 'error',
                  })
                }
              />
              {!quiz.isSharedWithMe && (
                <SaveAiStudyButton
                  fullWidth
                  saved={savedInMyStudy}
                  disabled={isSaving}
                  onClick={handleToggleSave}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Mode A: Stepped Question Resolution */}
      {!isSubmitted && (
        <Card sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          {/* Progress bar */}
          <Box sx={{ px: 3, pt: 3, pb: 1 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Pregunta {currentIndex + 1} de {totalQuestions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Respondidas: {answeredCount} de {totalQuestions}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            {currentQuestion ? (
              <Box>
                <Typography variant="h6" component="h2" fontWeight={600} sx={{ mb: 2.5 }}>
                  {currentQuestion.question}
                </Typography>

                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                  <RadioGroup
                    value={
                      userAnswers[currentIndex] !== undefined
                        ? String(userAnswers[currentIndex])
                        : ''
                    }
                    onChange={(e) => handleSelectOption(Number(e.target.value))}
                  >
                    <Stack spacing={1.5}>
                      {currentQuestion.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[currentIndex] === optIdx;
                        return (
                          <Box
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              border: 1,
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              bgcolor: isSelected ? 'action.selected' : 'background.paper',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-in-out',
                              '&:hover': {
                                bgcolor: 'action.hover',
                                borderColor: isSelected ? 'primary.main' : 'grey.400',
                              },
                            }}
                          >
                            <FormControlLabel
                              value={String(optIdx)}
                              control={<Radio size="small" />}
                              label={
                                <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                                  {opt}
                                </Typography>
                              }
                              sx={{ width: '100%', m: 0 }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {/* Step controls */}
                <Divider sx={{ my: 2 }} />
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBeforeOutlinedIcon />}
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    Anterior
                  </Button>

                  {currentIndex < totalQuestions - 1 ? (
                    <Button
                      variant="contained"
                      endIcon={<NavigateNextOutlinedIcon />}
                      onClick={handleNext}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting || answeredCount === 0}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CheckCircleOutlinedIcon />
                        )
                      }
                    >
                      Finalizar cuestionario
                    </Button>
                  )}
                </Stack>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Mode B: Detailed Results and AI Justifications */}
      {isSubmitted && (
        <Box>
          {/* Score Summary Box */}
          <Card
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: 1,
              borderColor: scorePercentage >= 60 ? 'success.main' : 'warning.main',
              bgcolor: (theme) =>
                scorePercentage >= 60
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(46, 125, 50, 0.12)'
                    : 'rgba(46, 125, 50, 0.08)'
                  : theme.palette.mode === 'dark'
                    ? 'rgba(237, 108, 2, 0.12)'
                    : 'rgba(237, 108, 2, 0.08)',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}
            >
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                  Calificación obtenida
                </Typography>
                <Typography variant="h3" component="p" fontWeight={800} color="primary.main">
                  {scorePercentage}%
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                  {correctCount} de {totalQuestions} respuestas correctas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {scorePercentage >= 80
                    ? '¡Excelente resultado! Dominas con solvencia los conceptos evaluados.'
                    : scorePercentage >= 60
                      ? 'Buen desempeño. Repasa las preguntas erróneas para reforzar tu aprendizaje.'
                      : 'Te sugerimos consultar nuevamente los apuntes del repositorio y volver a intentarlo.'}
                </Typography>
              </Box>

              <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ReplayOutlinedIcon />}
                  onClick={handleRetry}
                  fullWidth
                >
                  Volver a intentar
                </Button>
                <Button
                  component={RouterLink}
                  to="/ai/my-study"
                  variant="contained"
                  fullWidth
                >
                  Ir a Mi estudio
                </Button>
              </Stack>
            </Stack>
          </Card>

          {/* AI Explanation of Each Question */}
          <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
            Retroalimentación y justificaciones académicas
          </Typography>

          <Stack spacing={2.5} sx={{ mb: 3 }}>
            {questions.map((q, idx) => {
              const selectedOpt = userAnswers[idx];
              const isCorrect = selectedOpt === q.correctIndex;
              const answered = selectedOpt !== undefined;

              return (
                <Card
                  key={q.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: { xs: 2, sm: 2.5 },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
                    {isCorrect ? (
                      <CheckCircleOutlinedIcon color="success" sx={{ mt: 0.3 }} />
                    ) : (
                      <CancelOutlinedIcon color="error" sx={{ mt: 0.3 }} />
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight={700}>
                        {idx + 1}. {q.question}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Options review */}
                  <Stack spacing={1} sx={{ pl: { sm: 4.5 }, mb: 2 }}>
                    {q.options.map((opt, optIdx) => {
                      const isThisSelected = selectedOpt === optIdx;
                      const isThisCorrect = optIdx === q.correctIndex;

                      let borderColor = 'divider';
                      let bgcolor = 'transparent';

                      if (isThisCorrect) {
                        borderColor = 'success.main';
                        bgcolor = 'action.selected';
                      } else if (isThisSelected && !isThisCorrect) {
                        borderColor = 'error.main';
                        bgcolor = 'action.hover';
                      }

                      return (
                        <Box
                          key={optIdx}
                          sx={{
                            p: 1.25,
                            borderRadius: 1,
                            border: 1,
                            borderColor,
                            bgcolor,
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography
                              variant="body2"
                              fontWeight={isThisCorrect || isThisSelected ? 700 : 400}
                              color={
                                isThisCorrect
                                  ? 'success.main'
                                  : isThisSelected
                                    ? 'error.main'
                                    : 'text.primary'
                              }
                            >
                              {opt}
                            </Typography>
                            {isThisCorrect && (
                              <Chip
                                size="small"
                                color="success"
                                label="Respuesta correcta"
                                sx={{ ml: 'auto', height: 22, fontSize: '0.75rem' }}
                              />
                            )}
                            {isThisSelected && !isThisCorrect && (
                              <Chip
                                size="small"
                                color="error"
                                label="Tu selección"
                                sx={{ ml: 'auto', height: 22, fontSize: '0.75rem' }}
                              />
                            )}
                          </Stack>
                        </Box>
                      );
                    })}
                    {!answered && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Pregunta no respondida.
                      </Typography>
                    )}
                  </Stack>

                  {/* AI Explanation Box */}
                  <Box
                    sx={{
                      ml: { sm: 4.5 },
                      p: 1.75,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                      borderLeft: 4,
                      borderColor: 'primary.main',
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                      <SmartToyOutlinedIcon color="primary" fontSize="small" />
                      <Typography variant="caption" fontWeight={700} color="primary.main">
                        Justificación de la IA
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {q.explanation}
                    </Typography>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Floating or Footer info */}
      <Alert
        severity="info"
        icon={<HelpOutlineOutlinedIcon />}
        sx={{ mt: 3, mb: 4, borderRadius: 2 }}
      >
        Las preguntas y justificaciones son generadas con base en los contenidos cargados en Alejandría.
        Puedes guardar este cuestionario en tu sección &ldquo;Mi estudio&rdquo; para repasar antes de tus evaluaciones.
      </Alert>

      {/* Share with mutual friends dialog */}
      <ShareAiDialog
        open={shareOpen}
        material={quiz}
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
