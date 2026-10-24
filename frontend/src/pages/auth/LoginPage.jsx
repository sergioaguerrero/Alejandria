/**
 * @file LoginPage.jsx
 * @description View 1 — Login (FE-05, endpoint BE-06).
 *
 * Rules from the statement:
 *  - Email and password fields plus the sign-in button.
 *  - Validate the email format and that no field is empty.
 *  - An Alert with "Credenciales incorrectas" on 401, and a different
 *    message if the account is suspended (both come from the service).
 *  - On success, save the session and redirect: student to Home,
 *    admin to the reports inbox.
 *  - Links to Register (view 2) and Recover password (view 3).
 */

import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useAuth } from '../../context/authContext.js';
import { isValidEmail } from '../../utils/validations.js';

const INITIAL_VALUES = {
  email: '',
  password: '',
};

/** Form fields that are validated. */
const FIELDS = ['email', 'password'];

/**
 * Validates the form on the client before calling the service.
 * @param {typeof INITIAL_VALUES} values
 * @returns {Record<string, string>}
 */
function validate(values) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (String(values.email).trim() === '') {
    errors.email = 'Escribe tu correo.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Escribe un correo válido.';
  }

  if (String(values.password) === '') {
    errors.password = 'Escribe tu contraseña.';
  }

  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = validate(values);

  /**
   * Visible error of a field, shown once the field was touched.
   * @param {string} field
   * @returns {string|undefined}
   */
  const errorFor = (field) =>
    touched[field] ? validationErrors[field] : undefined;

  /** Updates a field while the user fixes it and clears the general error. */
  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [field]: value }));
    setGeneralError('');
  };

  /** Marks the field as touched on blur, to show its errors. */
  const markTouched = (field) => () =>
    setTouched((previous) => ({ ...previous, [field]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGeneralError('');

    // On submit all field errors are shown.
    setTouched(Object.fromEntries(FIELDS.map((field) => [field, true])));

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: values.email,
        password: values.password,
      });

      // Back to the guarded route that sent us here, or Home.
      // TODO(FE-22): admins should land on the reports inbox (view 22,
      // /admin/reports) once that view and its route exist.
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (error) {
      setGeneralError(error?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Iniciar sesión
          </Typography>
          <Typography variant="body2">
            Entra con tu correo institucional.
          </Typography>
        </Box>

        {generalError && <Alert severity="error">{generalError}</Alert>}

        <TextField
          label="Correo institucional"
          type="email"
          value={values.email}
          onChange={handleChange('email')}
          onBlur={markTouched('email')}
          error={Boolean(errorFor('email'))}
          helperText={errorFor('email')}
          autoComplete="email"
        />

        <TextField
          label="Contraseña"
          type="password"
          value={values.password}
          onChange={handleChange('password')}
          onBlur={markTouched('password')}
          error={Boolean(errorFor('password'))}
          helperText={errorFor('password')}
          autoComplete="current-password"
        />

        <Button type="submit" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>

        <Stack spacing={1} sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            ¿No tienes cuenta?{' '}
            <Link component={RouterLink} to="/register">
              Regístrate
            </Link>
          </Typography>
          <Typography variant="body2">
            <Link component={RouterLink} to="/recover">
              ¿Olvidaste tu contraseña?
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
