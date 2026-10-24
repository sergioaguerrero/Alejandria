/**
 * @file AuthLayout.jsx
 * @description Structure of the public views: login and register (FE-04).
 *
 * Two columns on wide screens: the brand panel with the lighthouse mark, the
 * name and the subtitle on the left, and the form on the right. On narrow
 * screens the brand collapses into a compact header above the form. Views are
 * rendered in <Outlet />.
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
          flex: '0 0 45%',
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
              `radial-gradient(circle at 50% 38%, ${alpha(
                theme.palette.primary.main,
                0.16,
              )}, transparent 60%)`,
          }}
        />

        <Stack
          spacing={3}
          sx={{ position: 'relative', alignItems: 'center', textAlign: 'center', maxWidth: 420 }}
        >
          <LighthouseMark size={80} />

          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h2" component="p">
              Alejandría UPC
            </Typography>
            <Typography variant="subtitle1">Repositorio virtual académico UPC</Typography>
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
        <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 540 }}>
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
            <LighthouseMark size={30} />
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
