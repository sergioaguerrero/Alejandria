/**
 * @file ReportDetailPage.jsx
 * @description View 23 — Report Detail (FE-24, BE-27, BE-28).
 *
 * Admin view that displays reported content details, author information,
 * and allows moderation actions: discard, hide, delete, warn author, or suspend author.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import { useAuth } from '../../context/authContext.js';
import { REPORT_REASONS } from '../../mocks/catalogs.js';
import { getReportById, resolveReport } from '../../services/index.js';
import { formatRelativeDate } from '../../utils/formatDate.js';

function reportReasonLabel(reason) {
  const found = REPORT_REASONS.find((r) => r.value === reason);
  return found ? found.label : reason;
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(null);

  // Moderation action modal state
  const [actionDialog, setActionDialog] = useState({
    open: false,
    action: '',
    title: '',
    description: '',
  });
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loading = !user || loadedKey !== `${id}:${reloadKey}`;

  useEffect(() => {
    if (!user || !id) return undefined;
    let active = true;

    getReportById(id)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Error al cargar el detalle del reporte.');
      })
      .finally(() => {
        if (active) setLoadedKey(`${id}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [user, id, reloadKey]);

  const openActionDialog = (action) => {
    setAdminNote('');
    let title = '';
    let description = '';

    switch (action) {
      case 'descartado':
        title = 'Descartar reporte';
        description = 'El reporte se marcará como resuelto sin aplicar medidas sobre el contenido.';
        break;
      case 'ocultado':
        title = 'Ocultar contenido';
        description = 'El contenido dejará de aparecer en las búsquedas y listados para los estudiantes.';
        break;
      case 'eliminado':
        title = 'Eliminar contenido';
        description = 'El contenido será eliminado permanentemente del repositorio académico.';
        break;
      case 'advertencia':
        title = 'Enviar advertencia al autor';
        description = 'Se registrará una advertencia en el historial del estudiante y recibirá una notificación.';
        break;
      case 'suspension':
        title = 'Suspender cuenta del autor';
        description = 'La cuenta del usuario quedará suspendida y no podrá iniciar sesión ni publicar material.';
        break;
      default:
        break;
    }

    setActionDialog({ open: true, action, title, description });
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.action) return;
    setIsSubmitting(true);
    try {
      await resolveReport(id, {
        action: actionDialog.action,
        note: adminNote,
      });

      window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
      setActionDialog((prev) => ({ ...prev, open: false }));
      setSnackbar({
        open: true,
        message: 'Acción de moderación aplicada exitosamente. Volviendo a la bandeja...',
        severity: 'success',
      });

      setTimeout(() => {
        navigate('/admin/reports');
      }, 1200);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'No se pudo aplicar la acción.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Button
        component={RouterLink}
        to="/admin/reports"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        Volver a la bandeja de reportes
      </Button>

      {/* Loading state */}
      {loading && (
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={240} />
          <Skeleton variant="rectangular" height={160} />
        </Stack>
      )}

      {/* Error state */}
      {!loading && error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setReloadKey((k) => k + 1)}>
              Reintentar
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Report content */}
      {!loading && !error && report && (
        <Stack spacing={3}>
          {/* Header Card */}
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Typography variant="h5" component="h1" fontWeight={700}>
                    Reporte {report.id}
                  </Typography>
                  <Chip
                    size="small"
                    color={report.status === 'pendiente' ? 'warning' : 'success'}
                    label={report.status === 'pendiente' ? 'Pendiente' : 'Resuelto'}
                  />
                  {report.resolution && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Resolución: ${report.resolution}`}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Enviado por @{report.reporterUsername} · {formatRelativeDate(report.createdAt)}
                </Typography>
              </Box>

              <Chip
                label={`Motivo: ${reportReasonLabel(report.reason)}`}
                color="error"
                variant="outlined"
              />
            </Box>

            {report.comment && (
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5, mt: 1 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">
                  Comentario del denunciante:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  &ldquo;{report.comment}&rdquo;
                </Typography>
              </Box>
            )}

            {report.status === 'resuelto' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1.5 }}>
                <Typography variant="subtitle2" color="text.primary">
                  Resolución del administrador:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {report.note || 'Sin nota de moderación registrada.'}
                </Typography>
                {report.resolvedAt && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                    Resuelto el {new Date(report.resolvedAt).toLocaleString('es-CO')}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>

          {/* Grid with Content preview and Author information */}
          <Grid container spacing={3}>
            {/* Target element */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {report.targetType === 'document' && <DescriptionOutlinedIcon color="primary" />}
                    {report.targetType === 'repository' && <FolderOutlinedIcon color="info" />}
                    {report.targetType === 'profile' && <PersonOutlineIcon color="action" />}
                    <Typography variant="h6" component="h2">
                      Contenido reportado ({report.targetType})
                    </Typography>
                  </Box>

                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                    {report.targetLabel}
                  </Typography>

                  {report.targetData && (
                    <Box sx={{ mb: 2 }}>
                      {report.targetData.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {report.targetData.description}
                        </Typography>
                      )}

                      {report.targetType === 'document' && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                          {report.targetData.subject && (
                            <Chip size="small" label={report.targetData.subject.name} />
                          )}
                          {report.targetData.type && (
                            <Chip size="small" variant="outlined" label={report.targetData.type} />
                          )}
                          {report.targetData.term && (
                            <Chip size="small" variant="outlined" label={`Corte ${report.targetData.term}`} />
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box sx={{ pt: 1 }}>
                    {report.targetType === 'document' && (
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/documents/${report.targetId}`}
                        variant="outlined"
                      >
                        Abrir documento
                      </Button>
                    )}
                    {report.targetType === 'repository' && (
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/repositories/${report.targetId}`}
                        variant="outlined"
                      >
                        Abrir repositorio
                      </Button>
                    )}
                    {report.targetType === 'profile' && (
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/users/${report.targetId}`}
                        variant="outlined"
                      >
                        Ver perfil público
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Author info card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Autor del contenido
                  </Typography>

                  {report.author ? (
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Nombre
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {report.author.name}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Usuario
                        </Typography>
                        <Typography variant="body2">@{report.author.username}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Correo
                        </Typography>
                        <Typography variant="body2">{report.author.email}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Estado de cuenta
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            color={report.author.suspended ? 'error' : 'success'}
                            label={report.author.suspended ? 'Suspendida' : 'Activa'}
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/admin/users/${report.author.id}`}
                        variant="outlined"
                      >
                        Ver historial del usuario
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No se encontró información del autor o fue eliminado.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Moderation Actions (only if pending) */}
          {report.status === 'pendiente' && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Acciones de moderación
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Elige la medida correspondiente para resolver este reporte. Todas las acciones solicitan una nota y se notifican al autor.
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CheckCircleOutlinedIcon />}
                  onClick={() => openActionDialog('descartado')}
                >
                  Descartar reporte
                </Button>

                {report.targetType === 'document' && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<VisibilityOffOutlinedIcon />}
                    onClick={() => openActionDialog('ocultado')}
                  >
                    Ocultar contenido
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => openActionDialog('eliminado')}
                >
                  Eliminar contenido
                </Button>

                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<WarningAmberOutlinedIcon />}
                  onClick={() => openActionDialog('advertencia')}
                >
                  Advertir al autor
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<BlockIcon />}
                  onClick={() => openActionDialog('suspension')}
                >
                  Suspender autor
                </Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {/* Confirmation and Note Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog((prev) => ({ ...prev, open: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{actionDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{actionDialog.description}</DialogContentText>
          <TextField
            autoFocus
            label="Nota de moderación (opcional)"
            fullWidth
            multiline
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Escribe el motivo o justificación de la decisión..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={
              actionDialog.action === 'suspension' || actionDialog.action === 'eliminado'
                ? 'error'
                : actionDialog.action === 'advertencia' || actionDialog.action === 'ocultado'
                  ? 'warning'
                  : 'primary'
            }
            onClick={handleConfirmAction}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Aplicando...' : 'Confirmar acción'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
}
