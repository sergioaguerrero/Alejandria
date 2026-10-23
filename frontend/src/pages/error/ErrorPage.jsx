/**
 * @file ErrorPage.jsx
 * @description Vista 26 — página de error para 403 y 404 (FE-03).
 *
 * La usan las rutas protegidas cuando el rol o el dueño no coincide, y
 * el router cuando la ruta no existe.
 */

import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../../context/authContext.js';

const CONTENIDO = {
  403: {
    codigo: '403',
    titulo: 'No tienes permiso',
    mensaje:
      'Tu cuenta no tiene acceso a esta sección. Si crees que es un error, escribe a coordinación académica.',
  },
  404: {
    codigo: '404',
    titulo: 'Página no encontrada',
    mensaje:
      'La dirección que abriste no existe o el contenido fue eliminado. Revisa el enlace e intenta de nuevo.',
  },
};

/**
 * @param {object} props
 * @param {403|404|number} [props.code=404]
 */
export default function ErrorPage({ code = 404 }) {
  const { estaAutenticado } = useAuth();
  const info = CONTENIDO[code] ?? CONTENIDO[404];

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
        <Typography variant="overline">Error {info.codigo}</Typography>

        <Typography
          variant="h1"
          sx={{ fontSize: { xs: '4.5rem', md: '7rem' }, color: 'primary.main', lineHeight: 1 }}
        >
          {info.codigo}
        </Typography>

        <Typography variant="h4">{info.titulo}</Typography>

        <Typography variant="body1" color="text.secondary">
          {info.mensaje}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ pt: 2, width: { xs: '100%', sm: 'auto' } }}
        >
          <Button component={RouterLink} to="/">
            Volver al inicio
          </Button>

          {!estaAutenticado && (
            <Button component={RouterLink} to="/login" variant="outlined">
              Iniciar sesión
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
