/**
 * @file AuthLayout.jsx
 * @description Estructura de las vistas públicas: login, registro,
 * recuperar contraseña y nueva contraseña (FE-04).
 *
 * Centra una tarjeta en pantalla completa con la marca arriba. Las vistas
 * se renderizan en el <Outlet />.
 */

import { Box, Paper, Stack, Typography } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 480, alignItems: 'center' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <MenuBookIcon color="primary" />
          <Typography variant="h5">Alejandría UPC</Typography>
        </Stack>

        <Paper sx={{ width: '100%', p: { xs: 3, sm: 4 } }}>
          <Outlet />
        </Paper>

        <Typography variant="caption">Universidad Popular del Cesar</Typography>
      </Stack>
    </Box>
  );
}
