/**
 * @file RecoverPasswordPage.jsx
 * @description View 3 — Password recovery request (FE-08, BE-10).
 *
 * Captures institutional email and sends recovery instructions.
 * Displays a neutral message to prevent account enumeration.
 */

import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';

import { requestPasswordReset } from '../../services/index.js';
import { INSTITUTIONAL_DOMAIN, isInstitutionalEmail, isValidEmail } from '../../utils/validations.js';

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);

  const cleanEmail = email.trim();
  let emailError = '';
  if (touched) {
    if (!cleanEmail) {
      emailError = 'Escribe tu correo institucional.';
    } else if (!isValidEmail(cleanEmail) || !isInstitutionalEmail(cleanEmail)) {
      emailError = `Debes usar tu correo institucional ${INSTITUTIONAL_DOMAIN}.`;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setGeneralError('');

    if (!cleanEmail || !isValidEmail(cleanEmail) || !isInstitutionalEmail(cleanEmail)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(cleanEmail);
      setSubmittedResult(result);
    } catch (err) {
      setGeneralError(err?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight={700}>
            Recuperar contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu acceso.
          </Typography>
        </Box>

        {generalError && <Alert severity="error">{generalError}</Alert>}

        {submittedResult ? (
          <Stack spacing={2.5}>
            <Alert
              icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
              severity="success"
              sx={{ py: 1.5 }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Solicitud enviada
              </Typography>
              <Typography variant="body2">
                {submittedResult.message}
              </Typography>
            </Alert>

            {/* In mock mode, surface direct link for demo convenience */}
            {submittedResult.testToken && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="caption" color="primary.main" fontWeight={600} display="block">
                  Simulación de correo (Modo demostración):
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Haz clic a continuación para abrir el enlace de recuperación generado:
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/reset-password/${submittedResult.testToken}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Abrir enlace de restablecimiento
                </Button>
              </Box>
            )}

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              startIcon={<ArrowBackIcon />}
            >
              Volver al inicio de sesión
            </Button>
          </Stack>
        ) : (
          <>
            <TextField
              label="Correo institucional"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (generalError) setGeneralError('');
              }}
              onBlur={() => setTouched(true)}
              error={Boolean(emailError)}
              helperText={emailError || `Debe terminar en ${INSTITUTIONAL_DOMAIN}`}
              placeholder="usuario@unicesar.edu.co"
              autoComplete="email"
              required
              fullWidth
            />

            <Button
              type="submit"
              size="large"
              variant="contained"
              disabled={isSubmitting}
              startIcon={<MarkEmailReadOutlinedIcon />}
            >
              {isSubmitting ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </Button>

            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Typography variant="body2">
                ¿Recordaste tu contraseña?{' '}
                <Link component={RouterLink} to="/login">
                  Inicia sesión
                </Link>
              </Typography>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
