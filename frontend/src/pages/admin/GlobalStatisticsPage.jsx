/**
 * @file GlobalStatisticsPage.jsx
 * @description View 24 — Global Statistics (FE-26, BE-23).
 *
 * Administrator analytics dashboard that monitors academic demand,
 * active students, top consultations and moderation report status.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import AdvancedAnalyticsSection from '../../components/admin/AdvancedAnalyticsSection.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import { getAdvancedAdminStatistics, getGlobalStatistics } from '../../services/index.js';

function SummaryCard({ title, value, subtitle, icon: Icon, color = 'primary.main' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'action.hover',
              color,
            }}
          >
            <Icon fontSize="medium" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function GlobalStatisticsPage() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('week');
  const [advancedData, setAdvancedData] = useState(null);
  const [loadedAdvKey, setLoadedAdvKey] = useState('');

  const loading = !user || loadedKey !== `${user.username}:${reloadKey}`;

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    getGlobalStatistics()
      .then((stats) => {
        if (!active) return;
        setData(stats);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Error al cargar las estadísticas globales.');
      })
      .finally(() => {
        if (active) setLoadedKey(`${user.username}:${reloadKey}`);
      });

    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  const advTargetKey = user ? `${user.username}:${period}:${reloadKey}` : '';
  const isAdvancedLoading = Boolean(advTargetKey && loadedAdvKey !== advTargetKey);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const reqKey = `${user.username}:${period}:${reloadKey}`;

    getAdvancedAdminStatistics(period)
      .then((adv) => {
        if (!active) return;
        setAdvancedData(adv);
      })
      .catch(() => {
        if (!active) return;
        setAdvancedData(null);
      })
      .finally(() => {
        if (active) setLoadedAdvKey(reqKey);
      });

    return () => {
      active = false;
    };
  }, [user, period, reloadKey]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Estadísticas globales
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Indicadores generales de uso académico, demanda de contenidos y reportes de la comunidad.
        </Typography>
      </Box>

      {/* Loading state */}
      {loading && (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((key) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rectangular" height={100} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={300} />
          <Skeleton variant="rectangular" height={240} />
        </Stack>
      )}

      {/* Error state */}
      {!loading && error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Box
              component="button"
              onClick={() => setReloadKey((k) => k + 1)}
              sx={{ bgcolor: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              Reintentar
            </Box>
          }
        >
          {error}
        </Alert>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <Stack spacing={4}>
          {/* Summary KPI Cards */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Estudiantes activos"
                value={data.totals.activeStudents}
                subtitle="Cuentas habilitadas"
                icon={GroupOutlinedIcon}
                color="info.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Repositorios"
                value={data.totals.repositories}
                subtitle="Espacios de estudio"
                icon={FolderOutlinedIcon}
                color="primary.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Documentos"
                value={data.totals.documents}
                subtitle="Archivos compartidos"
                icon={DescriptionOutlinedIcon}
                color="info.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Reportes totales"
                value={data.totals.totalReports}
                subtitle={`${data.totals.pendingReports} pendientes · ${data.totals.resolvedReports} resueltos`}
                icon={ReportProblemOutlinedIcon}
                color="warning.main"
              />
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3}>
            {/* Top Subjects Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Asignaturas más consultadas
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Vistas acumuladas en los documentos de la materia
                  </Typography>

                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topSubjects} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="subject"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="vistas" name="Visualizaciones" fill="#1976d2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Students by Semester Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Estudiantes por semestre
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Distribución de estudiantes registrados activos
                  </Typography>

                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.studentsBySemester}
                        margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="semestre" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="estudiantes" name="Estudiantes" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top topics and reports breakdown row */}
          <Grid container spacing={3}>
            {/* Top Topics Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Temas con mayor contenido
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Cantidad de documentos subidos por temática
                  </Typography>

                  <Box sx={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topTopics} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis dataKey="tema" type="category" tick={{ fontSize: 12 }} width={100} />
                        <RechartsTooltip />
                        <Bar dataKey="documentos" name="Documentos" fill="#ed6c02" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Reports Breakdown Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Resumen de moderación
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Estado de reportes clasificados por motivo
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" aria-label="Resumen de reportes">
                      <TableHead>
                        <TableRow>
                          <TableCell>Motivo</TableCell>
                          <TableCell align="center">Pendientes</TableCell>
                          <TableCell align="center">Resueltos</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.reasonsSummary.map((row) => (
                          <TableRow key={row.reason}>
                            <TableCell>{row.reason}</TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                color={row.pendientes > 0 ? 'warning' : 'default'}
                                label={row.pendientes}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={row.resueltos} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {row.pendientes + row.resueltos}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top documents table */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Documentos más demandados
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Materiales académicos con mayor interacción en la plataforma
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="Documentos más vistos">
                  <TableHead>
                    <TableRow>
                      <TableCell>Título</TableCell>
                      <TableCell>Materia</TableCell>
                      <TableCell align="right">Vistas</TableCell>
                      <TableCell align="right">Descargas</TableCell>
                      <TableCell align="right">Me gusta</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Typography
                            component={RouterLink}
                            to={`/documents/${doc.id}`}
                            variant="body2"
                            fontWeight={600}
                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {doc.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {doc.subjectName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{doc.views}</TableCell>
                        <TableCell align="right">{doc.downloads}</TableCell>
                        <TableCell align="right">{doc.likes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* FE-37: Advanced Activity Analytics */}
      {!loading && !error && data && (
        <Box sx={{ mt: 3 }}>
          <AdvancedAnalyticsSection
            period={period}
            onPeriodChange={setPeriod}
            data={advancedData}
            isLoading={isAdvancedLoading}
          />
        </Box>
      )}

      {/* Empty State */}
      {!loading && !error && !data && (
        <EmptyState
          icon={InsightsIcon}
          title="Sin datos analíticos"
          description="Aún no hay suficiente actividad registrada para mostrar estadísticas globales."
        />
      )}
    </Box>
  );
}
