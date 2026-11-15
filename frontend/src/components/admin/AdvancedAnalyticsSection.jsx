/**
 * @file AdvancedAnalyticsSection.jsx
 * @description Admin advanced activity analytics section (FE-37, RF-64, RF-65, BE-25).
 *
 * Displays active users filtered by period (day/week/month), most frequent search terms,
 * and AI usage statistics broken down by content type, repository, and timeline.
 */

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import AiTypeIcon from '../ai/AiTypeIcon.jsx';

const PERIOD_LABELS = {
  day: 'Hoy',
  week: 'Última semana',
  month: 'Último mes',
};

const AI_TYPE_COLOR_KEY = {
  quiz: 'primary',
  summary: 'info',
  guide: 'success',
  slides: 'warning',
};

const getAiTypeColorKey = (contentType) => AI_TYPE_COLOR_KEY[contentType] || 'primary';

export default function AdvancedAnalyticsSection({ period, onPeriodChange, data, isLoading }) {
  const theme = useTheme();
  const periodLabel = PERIOD_LABELS[period] || PERIOD_LABELS.week;
  const aiAccentColor = theme.palette.mode === 'dark' ? '#A78BFA' : '#4F46E5';

  const getChartAxisProps = (fontSize = 12) => ({
    tick: { fontSize, fill: theme.palette.text.secondary },
    axisLine: { stroke: theme.palette.divider },
    tickLine: { stroke: theme.palette.divider },
  });

  const tooltipProps = {
    cursor: { fill: theme.palette.action.hover },
    contentStyle: {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[4],
    },
    itemStyle: { color: theme.palette.text.primary },
    labelStyle: { color: theme.palette.text.secondary, fontWeight: 600, marginBottom: 4 },
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Divider sx={{ mb: 3 }} />

      {/* Section Header + Period Selector */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <TrendingUpOutlinedIcon color="primary" />
            <Typography variant="h5" component="h2" fontWeight={700}>
              Analítica avanzada de actividad
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Usuarios activos por periodo, términos más buscados y adopción de herramientas IA.
          </Typography>
        </Box>

        <ToggleButtonGroup
          size="small"
          exclusive
          color="primary"
          value={period}
          onChange={(_event, nextPeriod) => {
            if (nextPeriod) onPeriodChange(nextPeriod);
          }}
          aria-label="Periodo de analítica avanzada"
        >
          <ToggleButton value="day">Día</ToggleButton>
          <ToggleButton value="week">Semana</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {isLoading || !data ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((k) => (
            <Grid key={k} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack spacing={3}>
          {/* 3 Highlight Metric Cards */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <GroupOutlinedIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Usuarios activos ({periodLabel})
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {data.activeUsers.totalActive} / {data.activeUsers.totalStudents}
                      </Typography>
                      <Typography variant="caption" color="success.main" fontWeight={600}>
                        {data.activeUsers.engagementRate}% participación • {data.activeUsers.deltaLabel}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <SearchOutlinedIcon color="info" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        Término más buscado
                      </Typography>
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {data.topSearchTerms[0]?.term || 'Sin búsquedas'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.topSearchTerms[0]?.count ?? 0} búsquedas registradas
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <AutoAwesomeOutlinedIcon sx={{ color: aiAccentColor }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Generaciones IA ({periodLabel})
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {data.aiUsage.periodGenerations}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.aiUsage.totalGenerations} acumuladas • {data.aiUsage.sharedWithFriends} compartidas
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Row 1: Active Users Timeline + Frequent Search Terms */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Usuarios activos por periodo ({periodLabel})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Comparativa de estudiantes activos únicos y sesiones de estudio
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.activeUsers.timeline} margin={{ top: 10, right: 10, left: -12, bottom: 5 }}>
                        <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" {...getChartAxisProps(12)} />
                        <YAxis allowDecimals={false} {...getChartAxisProps(12)} />
                        <RechartsTooltip {...tooltipProps} />
                        <Bar
                          dataKey="activos"
                          name="Usuarios activos"
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="sesiones"
                          name="Sesiones"
                          fill={theme.palette.info.main}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Términos de búsqueda más frecuentes
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Consultas principales en el buscador académico
                  </Typography>
                  <Stack spacing={1.5}>
                    {data.topSearchTerms.map((item, idx) => (
                      <Box key={item.term}>
                        <Stack
                          direction="row"
                          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
                        >
                          <Typography variant="body2" fontWeight={idx < 3 ? 700 : 500} noWrap>
                            {idx + 1}. {item.term}
                          </Typography>
                          <Chip size="small" variant="outlined" label={`${item.count}`} />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={item.sharePercent}
                          color={idx === 0 ? 'primary' : 'info'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Row 2: AI Usage Statistics */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Uso de IA por tipo de contenido ({periodLabel})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Distribución entre cuestionarios, resúmenes, guías y diapositivas
                  </Typography>

                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                    {data.aiUsage.byType.map((entry) => (
                      <Chip
                        key={entry.contentType}
                        size="small"
                        variant="outlined"
                        color={getAiTypeColorKey(entry.contentType)}
                        icon={<AiTypeIcon type={entry.contentType} fontSize="small" />}
                        label={`${entry.label}: ${entry.count}`}
                      />
                    ))}
                  </Stack>

                  <Box sx={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.aiUsage.byType} margin={{ top: 10, right: 10, left: -12, bottom: 5 }}>
                        <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" {...getChartAxisProps(12)} />
                        <YAxis allowDecimals={false} {...getChartAxisProps(12)} />
                        <RechartsTooltip {...tooltipProps} />
                        <Bar dataKey="count" name="Generaciones" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]}>
                          {data.aiUsage.byType.map((entry) => (
                            <Cell
                              key={entry.contentType}
                              fill={theme.palette[getAiTypeColorKey(entry.contentType)].main}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Tendencia y repositorios más estudiados con IA
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Evolución de generaciones ({periodLabel}) y repositorios destacados
                  </Typography>

                  <Box sx={{ width: '100%', height: 150, mb: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.aiUsage.timeline} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" {...getChartAxisProps(11)} />
                        <YAxis allowDecimals={false} {...getChartAxisProps(11)} />
                        <RechartsTooltip {...tooltipProps} />
                        <Bar
                          dataKey="generaciones"
                          name="Generaciones IA"
                          fill={theme.palette.warning.main}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" aria-label="Repositorios con mayor uso de IA">
                      <TableHead>
                        <TableRow>
                          <TableCell>Repositorio</TableCell>
                          <TableCell align="right">Generaciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.aiUsage.topRepositories.map((repo) => (
                          <TableRow key={repo.repositoryId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>
                                {repo.repositoryName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {repo.subjectName}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {repo.count}
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
        </Stack>
      )}
    </Box>
  );
}
