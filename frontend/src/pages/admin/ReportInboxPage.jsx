/**
 * @file ReportInboxPage.jsx
 * @description View 22 — Reports Inbox (FE-24, BE-27).
 *
 * Admin view that lists pending and resolved reports of repositories,
 * documents and user profiles, with filtering by reason and navigation to details.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import { REPORT_REASONS } from '../../mocks/catalogs.js';
import { getReports } from '../../services/index.js';
import { formatRelativeDate } from '../../utils/formatDate.js';

/**
 * Returns a human readable label for the report reason.
 * @param {string} reason
 */
function reportReasonLabel(reason) {
  const found = REPORT_REASONS.find((r) => r.value === reason);
  return found ? found.label : reason;
}

/**
 * Returns a chip icon and label for the target type.
 * @param {'document'|'repository'|'profile'} type
 */
function TargetTypeChip({ type }) {
  switch (type) {
    case 'document':
      return (
        <Chip
          icon={<DescriptionOutlinedIcon fontSize="small" />}
          label="Documento"
          size="small"
          variant="outlined"
          color="primary"
        />
      );
    case 'repository':
      return (
        <Chip
          icon={<FolderOutlinedIcon fontSize="small" />}
          label="Repositorio"
          size="small"
          variant="outlined"
          color="secondary"
        />
      );
    case 'profile':
      return (
        <Chip
          icon={<PersonOutlineIcon fontSize="small" />}
          label="Perfil"
          size="small"
          variant="outlined"
          color="default"
        />
      );
    default:
      return <Chip label={type} size="small" variant="outlined" />;
  }
}

/**
 * Resolution chip for resolved reports.
 * @param {{ resolution: string|null, status: string }} props
 */
function ResolutionChip({ resolution, status }) {
  if (status === 'pendiente') {
    return <Chip label="Pendiente" size="small" color="warning" />;
  }

  switch (resolution) {
    case 'descartado':
      return <Chip label="Descartado" size="small" variant="outlined" />;
    case 'ocultado':
      return <Chip label="Ocultado" size="small" color="default" />;
    case 'eliminado':
      return <Chip label="Eliminado" size="small" color="error" />;
    case 'advertencia':
      return <Chip label="Advertencia" size="small" color="warning" />;
    case 'suspension':
      return <Chip label="Suspensión" size="small" color="error" />;
    default:
      return <Chip label="Resuelto" size="small" color="success" />;
  }
}

export default function ReportInboxPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('pendiente'); // 'pendiente' | 'resuelto'
  const [reasonFilter, setReasonFilter] = useState('todos');
  const [reports, setReports] = useState([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(null);

  const loading = !user || loadedKey !== `${user.username}:${reloadKey}`;

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    getReports()
      .then((data) => {
        if (!active) return;
        setReports(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Error al cargar los reportes.');
      })
      .finally(() => {
        if (active) setLoadedKey(`${user.username}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  const pendingCount = reports.filter((r) => r.status === 'pendiente').length;
  const resolvedCount = reports.filter((r) => r.status === 'resuelto').length;

  const filteredReports = reports.filter((report) => {
    if (report.status !== activeTab) return false;
    if (reasonFilter !== 'todos' && report.reason !== reasonFilter) return false;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Bandeja de reportes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Modera los contenidos y perfiles reportados por la comunidad de Alejandría.
        </Typography>
      </Box>

      {/* Tabs and filters header */}
      <Paper sx={{ mb: 3, p: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e, val) => setActiveTab(val)}
            aria-label="Estado de los reportes"
          >
            <Tab
              value="pendiente"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Pendientes</span>
                  <Chip
                    size="small"
                    color={pendingCount > 0 ? 'warning' : 'default'}
                    label={pendingCount}
                  />
                </Box>
              }
            />
            <Tab
              value="resuelto"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Resueltos</span>
                  <Chip size="small" label={resolvedCount} />
                </Box>
              }
            />
          </Tabs>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="reason-filter-label">Filtrar por motivo</InputLabel>
            <Select
              labelId="reason-filter-label"
              value={reasonFilter}
              label="Filtrar por motivo"
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              <MenuItem value="todos">Todos los motivos</MenuItem>
              {REPORT_REASONS.map((reason) => (
                <MenuItem key={reason.value} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Loading state */}
      {loading && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              {[1, 2, 3, 4, 5].map((key) => (
                <Skeleton key={key} variant="rectangular" height={48} />
              ))}
            </Stack>
          </CardContent>
        </Card>
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

      {/* Empty state */}
      {!loading && !error && filteredReports.length === 0 && (
        <Card variant="outlined">
          <CardContent>
            <EmptyState
              icon={AssignmentTurnedInOutlinedIcon}
              title={
                activeTab === 'pendiente'
                  ? 'No hay reportes pendientes'
                  : 'No hay reportes resueltos'
              }
              description={
                activeTab === 'pendiente'
                  ? '¡Todo limpio! No hay contenidos esperando moderación en este momento.'
                  : 'Los reportes que atiendas se listarán aquí con el detalle de su resolución.'
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && !error && filteredReports.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="Lista de reportes">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Contenido reportado</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Reportado por</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow
                  key={report.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/reports/${report.id}`)}
                >
                  <TableCell>
                    <TargetTypeChip type={report.targetType} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {report.targetLabel}
                    </Typography>
                    {report.comment && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {report.comment}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{reportReasonLabel(report.reason)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      @{report.reporterUsername}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeDate(report.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ResolutionChip resolution={report.resolution} status={report.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/reports/${report.id}`);
                      }}
                    >
                      Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
