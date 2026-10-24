/**
 * @file AuthLayout.jsx
 * @description Structure of the public views: login and register (FE-04).
 *
 * Two columns on wide screens: a brand panel with the highlights of the
 * platform on the left and the form on the right. On narrow screens the brand
 * collapses into a compact header above the form. Views are rendered in
 * <Outlet />.
 */

import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GroupsIcon from '@mui/icons-material/Groups';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RouteIcon from '@mui/icons-material/Route';

import LighthouseMark from '../brand/LighthouseMark.jsx';

/** Highlights shown next to the form on wide screens. */
const HIGHLIGHTS = [
  {
    Icon: LibraryBooksIcon,
    title: 'Repositorios por materia',
    description:
      'Encuentra apuntes, talleres y parciales resueltos, organizados por materia y semestre.',
  },
  {
    Icon: CloudUploadIcon,
    title: 'Comparte tu material',
    description: 'Sube tus apuntes y ayuda a otros estudiantes de Ingeniería de Sistemas.',
  },
  {
    Icon: RouteIcon,
    title: 'Sigue tu ruta académica',
    description: 'Consulta los recursos sugeridos para cada semestre de tu pensum.',
  },
  {
    Icon: GroupsIcon,
    title: 'Comunidad UPC',
    description: 'Aprende de lo que comparten tus compañeros de la Universidad Popular del Cesar.',
  },
];

export default function AuthLayout() {
  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100svh' }}>
      {/* Brand panel — wide screens only */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 50%',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          p: 6,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: (theme) =>
              `radial-gradient(circle at 32% 30%, ${alpha(
                theme.palette.primary.main,
                0.14,
              )}, transparent 60%)`,
          }}
        />

        <Stack spacing={4} sx={{ position: 'relative', maxWidth: 440 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LighthouseMark size={24} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Alejandría UPC
            </Typography>
          </Stack>

          <Stack spacing={3}>
            {HIGHLIGHTS.map(({ Icon, title, description }) => (
              <Stack key={title} direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Icon sx={{ color: 'primary.main', fontSize: 24, mt: 0.25 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2">{description}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Form */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          py: { xs: 4, sm: 5 },
        }}
      >
        <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 460 }}>
          {/* Compact brand — narrow screens only */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LighthouseMark size={26} />
            <Typography variant="h5">Alejandría UPC</Typography>
          </Stack>

          <Paper sx={{ width: '100%', p: { xs: 3, sm: 4 } }}>
            <Outlet />
          </Paper>

          <Typography variant="caption" sx={{ textAlign: 'center' }}>
            Universidad Popular del Cesar
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
