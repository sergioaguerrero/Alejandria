/**
 * @file AdminUserPage.jsx
 * @description View 25 — User Management (FE-24, BE-28).
 *
 * Admin view that displays student profile details, status, sanctions
 * history, and allows suspending or reactivating the account.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import { getAdminUser, toggleUserSuspension } from '../../services/index.js';
import { formatRelativeDate } from '../../utils/formatDate.js';

function SanctionTypeChip({ type }) {
  switch (type) {
    case 'suspension':
      return <Chip size="small" color="error" label="Suspensión" />;
    case 'advertencia':
      return <Chip size="small" color="warning" label="Advertencia" />;
    case 'reactivacion':
      return <Chip size="small" color="success" label="Reactivación" />;
    default:
      return <Chip size="small" label={type} />;
  }
}

export default function AdminUserPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [userData, setUserData] = useState(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loading = !user || loadedKey !== `${id}:${reloadKey}`;

  useEffect(() => {
    if (!user || !id) return undefined;
    let active = true;

    getAdminUser(id)
      .then((data) => {
        if (!active) return;
        setUserData(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Error al cargar la información del usuario.');
      })
      .finally(() => {
        if (active) setLoadedKey(`${id}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [user, id, reloadKey]);

  const handleOpenDialog = () => {
    setReason('');
    setDialogOpen(true);
  };

  const handleConfirmToggle = async () => {
    setIsSubmitting(true);
    try {
      await toggleUserSuspension(id, { reason });
      window.dispatchEvent(new CustomEvent('alejandria:notifications-changed'));
      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: userData.suspended
          ? 'Cuenta reactivada exitosamente.'
          : 'Cuenta suspendida exitosamente.',
        severity: 'success',
      });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.message || 'Error al actualizar el estado de la cuenta.',
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
        Volver a reportes
      </Button>

      {/* Loading */}
      {loading && (
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={160} />
          <Skeleton variant="rectangular" height={260} />
        </Stack>
      )}

      {/* Error */}
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

      {/* Content */}
      {!loading && !error && userData && (
        <Stack spacing={3}>
          {/* User overview card */}
          <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" component="h1" fontWeight={700}>
                    {userData.name}
                  </Typography>
                  <Chip
                    size="small"
                    color={userData.suspended ? 'error' : 'success'}
                    label={userData.suspended ? 'Cuenta suspendida' : 'Cuenta activa'}
                  />
                  <Chip size="small" variant="outlined" label={`Rol: ${userData.role}`} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  @{userData.username} · {userData.email}
                  {userData.semester ? ` · Semestre ${userData.semester}` : ''}
                </Typography>
              </Box>

              <Box>
                {userData.suspended ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleOutlinedIcon />}
                    onClick={handleOpenDialog}
                  >
                    Reactivar cuenta
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<BlockIcon />}
                    onClick={handleOpenDialog}
                  >
                    Suspender cuenta
                  </Button>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Repositorios
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {userData.repositoriesCount}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsertDriveFileOutlinedIcon color="secondary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Documentos
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {userData.documentsCount}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GavelIcon color="warning" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Sanciones
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {userData.sanctions.length}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOutlineIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Perfil público
                    </Typography>
                    <Box sx={{ mt: 0.25 }}>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/users/${userData.username}`}
                        variant="text"
                        sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                      >
                        Ver perfil
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Sanctions History */}
          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Historial de advertencias y sanciones
            </Typography>

            {userData.sanctions.length === 0 ? (
              <Card variant="outlined">
                <CardContent>
                  <EmptyState
                    icon={WarningAmberOutlinedIcon}
                    title="Sin sanciones registradas"
                    description="Este usuario tiene un historial limpio sin advertencias ni sanciones previas."
                  />
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table aria-label="Historial de sanciones">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medida</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Nota del administrador</TableCell>
                      <TableCell>Aplicado por</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userData.sanctions.map((sanction) => (
                      <TableRow key={sanction.id}>
                        <TableCell>
                          <SanctionTypeChip type={sanction.type} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{sanction.reason}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" color="text.secondary">
                            {sanction.note || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            @{sanction.adminUsername}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelativeDate(sanction.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Stack>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {userData?.suspended ? '¿Reactivar cuenta de usuario?' : '¿Suspender cuenta de usuario?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {userData?.suspended
              ? 'El usuario volverá a tener acceso completo para iniciar sesión, explorar y publicar contenidos.'
              : 'El usuario no podrá iniciar sesión ni publicar materiales en Alejandría UPC hasta que un administrador reactive su cuenta.'}
          </DialogContentText>
          <TextField
            label="Motivo o justificación (opcional)"
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe la razón de esta medida..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={userData?.suspended ? 'success' : 'error'}
            onClick={handleConfirmToggle}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Guardando...'
              : userData?.suspended
                ? 'Confirmar reactivación'
                : 'Confirmar suspensión'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
}
