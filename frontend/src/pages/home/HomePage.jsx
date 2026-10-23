/**
 * @file HomePage.jsx
 * @description Inicio provisional dentro del layout.
 *
 * TODO(FE-10): reemplazar por la vista 6 (Explorar repos) con RepoCard,
 * filtro por materia y paginación. Por ahora solo valida que el layout,
 * la sesión y las rutas protegidas funcionan.
 */

import { Alert, Box, Typography } from '@mui/material';

import { useAuth } from '../../context/authContext.js';

export default function HomePage() {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre?.split(' ')[0] ?? 'estudiante';

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Hola, {nombre}
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
