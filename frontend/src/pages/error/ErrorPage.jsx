/**
 * @file ErrorPage.jsx
 * @description View 26 — error page for 403 and 404 (FE-03).
 *
 * Used by the protected routes when the role or the owner does not match,
 * and by the router when the route does not exist.
 */

import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../../context/authContext.js';

const CONTENT = {
  403: {
    code: '403',
    title: 'No tienes permiso',
    message:
      'Tu cuenta no tiene acceso a esta sección. Si crees que es un error, escribe a coordinación académica.',
  },
  404: {
    code: '404',
    title: 'Página no encontrada',
    message:
      'La dirección que abriste no existe o el contenido fue eliminado. Revisa el enlace e intenta de nuevo.',
  },
};

/**
 * @param {object} props
 * @param {403|404|number} [props.code=404]
 */
export default function ErrorPage({ code = 404 }) {
  const { isAuthenticated } = useAuth();
  const info = CONTENT[code] ?? CONTENT[404];

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        px: 3,
        py: 6,
      }}
    >
      <Stack
        spacing={2}
        sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 520 }}
      >
        <Typography variant="overline">Error {info.code}</Typography>

        <Typography
          variant="h1"
          sx={{ fontSize: { xs: '4.5rem', md: '7rem' }, color: 'primary.main', lineHeight: 1 }}
        >
          {info.code}
        </Typography>

        <Typography variant="h4">{info.title}</Typography>

        <Typography variant="body1" color="text.secondary">
          {info.message}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ pt: 2, width: { xs: '100%', sm: 'auto' } }}
        >
          <Button component={RouterLink} to="/">
            Volver al inicio
          </Button>

          {!isAuthenticated && (
            <Button component={RouterLink} to="/login" variant="outlined">
              Iniciar sesión
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
