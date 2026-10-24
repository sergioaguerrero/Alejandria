/**
 * @file AuthLayout.jsx
 * @description Structure of the public views: login and register (FE-04).
 *
 * Two columns on wide screens: the brand panel on the left and the form on the
 * right. On narrow screens the brand collapses into a compact header above the
 * form. Views are rendered in <Outlet />.
 */

import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';

import LighthouseMark from '../brand/LighthouseMark.jsx';

export default function AuthLayout() {
  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100svh' }}>
      {/* Brand panel — wide screens only */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 44%',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
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
              `radial-gradient(circle at 50% 34%, ${alpha(
                theme.palette.primary.main,
                0.16,
              )}, transparent 62%)`,
          }}
        />

        <Stack
          spacing={2.5}
          sx={{ position: 'relative', alignItems: 'center', textAlign: 'center' }}
        >
          <LighthouseMark size={52} />
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h3" component="p">
              Alejandría UPC
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 340 }}>
              Comparte, encuentra y aprende con el material de tus compañeros.
            </Typography>
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
