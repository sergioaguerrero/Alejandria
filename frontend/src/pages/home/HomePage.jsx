/**
 * @file HomePage.jsx
 * @description Provisional home inside the layout.
 *
 * TODO(FE-10): replace with view 6 (Explore repositories) with RepoCard,
 * filter by subject and pagination. For now it only validates that the layout,
 * the session and the protected routes work.
 */

import { Alert, Box, Typography } from '@mui/material';

import { useAuth } from '../../context/authContext.js';

export default function HomePage() {
  const { user } = useAuth();
  const name = user?.name?.split(' ')[0] ?? 'estudiante';

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Hola, {name}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Este es el punto de partida de Alejandría UPC.
      </Typography>

      <Alert severity="info">
        La vista 6 (Explorar repos) se implementa en la historia FE-10.
      </Alert>
    </Box>
  );
}
