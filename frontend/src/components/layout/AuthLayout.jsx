/**
 * @file AuthLayout.jsx
 * @description Structure of the public views: login, register,
 * recover password and new password (FE-04).
 *
 * Centers a card on the full screen with the brand on top. Views
 * are rendered in <Outlet />.
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
        py: { xs: 4, sm: 5 },
      }}
    >
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 600, alignItems: 'center' }}>
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
