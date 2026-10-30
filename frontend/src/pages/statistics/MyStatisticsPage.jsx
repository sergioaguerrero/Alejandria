/**
 * @file MyStatisticsPage.jsx
 * @description View 17 — My statistics (FE-25, FE-27, RF-60, RF-61, endpoint BE-22).
 *
 * Totals of views, downloads and likes, the activity chart by week or month, the
 * most consulted subjects, the recent history and the performance of the
 * documents the student has uploaded. Sprint 2 works with sample data.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  Paper,
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
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import EmptyState from '../../components/common/EmptyState.jsx';
import { MATERIAL_TYPES } from '../../mocks/catalogs.js';
import { getMyStatistics } from '../../services/index.js';

/** Card with one total of the student. */
function StatCard({ title, value, icon: Icon, color = 'primary.main' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Stack>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              color,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon fontSize="large" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Label of a material type. */
function materialTypeLabel(type) {
  return MATERIAL_TYPES.find((materialType) => materialType.value === type)?.label ?? type;
}

export default function MyStatisticsPage() {
  const [period, setPeriod] = useState('week'); // 'week' | 'month'
  const [data, setData] = useState(null);
  const [loadedPeriod, setLoadedPeriod] = useState('');
  const [error, setError] = useState('');

  const isLoading = loadedPeriod !== period;

  useEffect(() => {
    let active = true;

    getMyStatistics(period)
      .then((statistics) => {
        if (active) setData(statistics);
      })
      .catch((serviceError) => {
        if (!active) return;
        setData(null);
        setError(serviceError?.message ?? 'No se pudieron cargar tus estadísticas.');
      })
      .finally(() => {
        if (active) setLoadedPeriod(period);
      });

    return () => {
      active = false;
    };
  }, [period]);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={220} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={320} />
      </Box>
    );
  }

  const totals = data?.totals ?? { documentsUploaded: 0, views: 0, downloads: 0, likes: 0 };
  const activity = data?.activity ?? [];
  const topSubjects = data?.topSubjects ?? [];
  const recentHistory = data?.recentHistory ?? [];
  const myDocuments = data?.myDocuments ?? [];

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Mis estadísticas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitorea tu interacción académica y el impacto de los recursos que has compartido.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Documentos subidos"
            value={totals.documentsUploaded}
            icon={DescriptionOutlinedIcon}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total de vistas"
            value={totals.views}
            icon={VisibilityOutlinedIcon}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Descargas acumuladas"
            value={totals.downloads}
            icon={DownloadOutlinedIcon}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Me gusta recibidos"
            value={totals.likes}
            icon={FavoriteBorderIcon}
            color="error.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack
                direction="row"
                sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Actividad académica
                </Typography>
                <Tabs
                  value={period}
                  onChange={(event, value) => setPeriod(value)}
                  sx={{ minHeight: 36, '& .MuiTab-root': { py: 0.5, minHeight: 36 } }}
                >
                  <Tab value="week" label="Semanal" />
                  <Tab value="month" label="Mensual" />
                </Tabs>
              </Stack>

              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="vistas"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      name="Vistas"
                    />
                    <Area
                      type="monotone"
                      dataKey="descargas"
                      stroke="#16a34a"
                      fill="#22c55e"
                      fillOpacity={0.2}
                      name="Descargas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Materias más consultadas
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSubjects} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="subject" type="category" width={110} fontSize={11} />
                    <RechartsTooltip />
                    <Bar
                      dataKey="consultados"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                      name="Consultas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Historial reciente de consultas
              </Typography>

              {recentHistory.length === 0 ? (
                <EmptyState
                  icon={VisibilityOutlinedIcon}
                  title="Sin consultas recientes"
                  description="Los documentos que abras aparecerán en este historial."
                />
              ) : (
                <Stack spacing={1.5} divider={<Divider />}>
                  {recentHistory.map((document) => (
                    <Stack
                      key={document.id}
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Stack spacing={0.2} sx={{ minWidth: 0, pr: 1 }}>
                        <Link
                          component={RouterLink}
                          to={`/documents/${document.id}`}
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                          noWrap
                          underline="hover"
                        >
                          {document.title}
                        </Link>
                        <Typography variant="caption" color="text.secondary">
                          {document.repositoryName}
                        </Typography>
                      </Stack>
                      <Chip
                        label={materialTypeLabel(document.type)}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Rendimiento de mis documentos
              </Typography>

              {myDocuments.length === 0 ? (
                <EmptyState
                  icon={DescriptionOutlinedIcon}
                  title="Sin documentos propios"
                  description="Aún no has compartido documentos en tus repositorios."
                />
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Documento</TableCell>
                        <TableCell align="center">Vistas</TableCell>
                        <TableCell align="center">Descargas</TableCell>
                        <TableCell align="center">Me gusta</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myDocuments.map((document) => (
                        <TableRow key={document.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>
                            <Link
                              component={RouterLink}
                              to={`/documents/${document.id}`}
                              color="inherit"
                              underline="hover"
                            >
                              {document.title}
                            </Link>
                          </TableCell>
                          <TableCell align="center">{document.views}</TableCell>
                          <TableCell align="center">{document.downloads}</TableCell>
                          <TableCell align="center">{document.likes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
