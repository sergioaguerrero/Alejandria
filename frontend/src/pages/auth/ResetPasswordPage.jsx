/**
 * @file ResetPasswordPage.jsx
 * @description View 4 — Reset password with token (FE-08, BE-10).
 *
 * Validates new password rules, checks password confirmation,
 * handles token expiration, and redirects to login on success.
 */

import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import RefreshIcon from '@mui/icons-material/Refresh';

import PasswordRules from '../../components/forms/PasswordRules.jsx';
import { resetPassword } from '../../services/index.js';
import { passwordErrors } from '../../utils/validations.js';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const pendingRules = passwordErrors(password);
  let confirmError = '';
  if (touched && password !== confirm) {
    confirmError = 'Las contraseñas no coinciden.';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setGeneralError('');

    if (pendingRules.length > 0 || password !== confirm) {
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password });
      navigate('/login', {
        replace: true,
        state: { notice: 'Tu contraseña se restableció exitosamente. Ya puedes iniciar sesión.' },
      });
    } catch (err) {
      if (err?.code === 'TOKEN_EXPIRED') {
        setIsTokenExpired(true);
      }
      setGeneralError(err?.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight={700}>
            Restablecer contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea una nueva contraseña segura para tu cuenta de Alejandría UPC.
          </Typography>
        </Box>

        {isTokenExpired ? (
          <Stack spacing={2}>
            <Alert severity="warning">
              {generalError || 'El enlace para restablecer la contraseña ha expirado o ya fue utilizado.'}
            </Alert>
            <Button
              component={RouterLink}
              to="/recover"
              variant="contained"
              startIcon={<RefreshIcon />}
            >
              Solicitar un nuevo enlace
            </Button>
          </Stack>
        ) : (
          <>
            {generalError && <Alert severity="error">{generalError}</Alert>}

            <Box>
              <TextField
                label="Nueva contraseña"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (generalError) setGeneralError('');
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                error={touched && pendingRules.length > 0}
                helperText={touched && pendingRules.length > 0 ? 'Cumple con todas las reglas de contraseña.' : ''}
                autoComplete="new-password"
                required
                fullWidth
              />
              <PasswordRules password={password} focused={passwordFocused} />
            </Box>

            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (generalError) setGeneralError('');
              }}
              onBlur={() => setTouched(true)}
              error={Boolean(confirmError)}
              helperText={confirmError}
              autoComplete="new-password"
              required
              fullWidth
            />

            <Button
              type="submit"
              size="large"
              variant="contained"
              disabled={isSubmitting}
              startIcon={<LockResetIcon />}
            >
              {isSubmitting ? 'Guardando nueva contraseña...' : 'Restablecer contraseña'}
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
}
