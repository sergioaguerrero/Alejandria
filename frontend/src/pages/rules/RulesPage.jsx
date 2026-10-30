/**
 * @file RulesPage.jsx
 * @description View 5 — Rules of use (FE-09, RF-11).
 *
 * Public page: explains what material can be uploaded, what cannot (current
 * exams), authorship and ownership, and the reasons for reporting content.
 * It is linked from the registration, the upload form and the footer.
 */

import { Link as RouterLink } from 'react-router-dom';

import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

import LighthouseMark from '../../components/brand/LighthouseMark.jsx';

/** Section heading with its icon. */
function SectionTitle({ icon: Icon, color, children }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
      <Icon color={color} />
      <Typography variant="h6" component="h2">
        {children}
      </Typography>
    </Stack>
  );
}

export default function RulesPage() {
  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            maxWidth: 880,
            mx: 'auto',
            px: { xs: 2, md: 3 },
            py: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack
            component={RouterLink}
            to="/"
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
          >
            <LighthouseMark size={28} />
            <Typography variant="h6" component="span">
              Alejandría
            </Typography>
          </Stack>

          <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} variant="text">
            Volver
          </Button>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={1} sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Normas de uso y política de contenido
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Alejandría es una plataforma colaborativa y académica para la comunidad
            universitaria.
          </Typography>
        </Stack>

        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent>
              <SectionTitle icon={CheckCircleOutlinedIcon} color="success">
                1. Contenido permitido y recomendado
              </SectionTitle>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Se promueve compartir material pedagógico que ayude al estudio y aprendizaje entre
                compañeros:
              </Typography>
              <Box
                component="ul"
                sx={{ pl: 3, m: 0, color: 'text.secondary', fontSize: '0.875rem' }}
              >
                <li>Apuntes de clase, notas y resúmenes de temas del pénsum.</li>
                <li>Guías de ejercicios resueltos y explicaciones paso a paso.</li>
                <li>Talleres y proyectos formativos desarrollados con fines educativos.</li>
                <li>Presentaciones y material de apoyo audiovisual o diapositivas.</li>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <SectionTitle icon={DoNotDisturbAltOutlinedIcon} color="error">
                2. Contenido estrictamente prohibido
              </SectionTitle>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Para preservar la integridad académica de la Universidad Popular del Cesar:
              </Typography>
              <Box
                component="ul"
                sx={{ pl: 3, m: 0, color: 'text.secondary', fontSize: '0.875rem' }}
              >
                <li>
                  <strong>Exámenes vigentes:</strong> está prohibido subir o solicitar parciales,
                  quizzes o evaluaciones activas.
                </li>
                <li>
                  <strong>Plagio o fraude académico:</strong> suplantaciones o distribución de
                  soluciones no autorizadas en evaluaciones.
                </li>
                <li>
                  <strong>Archivos maliciosos:</strong> scripts, ejecutables (.exe, .bat) o virus.
                  Solo se aceptan formatos de oficina, PDF e imágenes.
                </li>
                <li>
                  <strong>Contenido ofensivo o inapropiado:</strong> discriminación, acoso o
                  material ajeno al ámbito universitario.
                </li>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <SectionTitle icon={GavelOutlinedIcon} color="primary">
                3. Propiedad intelectual y autoría
              </SectionTitle>
              <Typography variant="body2" color="text.secondary">
                Cada usuario es responsable del material que publica. Al subir un documento,
                declaras bajo responsabilidad que eres el autor legítimo del trabajo o cuentas con
                autorización para difundirlo con propósitos estrictamente formativos.
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <SectionTitle icon={ReportProblemOutlinedIcon} color="warning">
                4. Moderación y reportes de la comunidad
              </SectionTitle>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                La comunidad puede reportar cualquier material bajo los siguientes motivos:
              </Typography>
              <Box
                component="ul"
                sx={{ pl: 3, m: 0, color: 'text.secondary', fontSize: '0.875rem' }}
              >
                <li>
                  <strong>Mal etiquetado:</strong> el material no corresponde a la materia,
                  semestre o tema indicado.
                </li>
                <li>
                  <strong>Contenido duplicado:</strong> el documento ya se encuentra disponible en
                  la plataforma.
                </li>
                <li>
                  <strong>Inapropiado u ofensivo:</strong> vulnera el respeto o las normas
                  académicas.
                </li>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                El equipo de administración revisará los reportes y se reserva el derecho de
                ocultar contenido, advertir al autor o suspender cuentas infractoras.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
