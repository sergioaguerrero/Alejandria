/**
 * @file RegisterPage.jsx
 * @description View 2 — Student registration (FE-04, endpoint BE-05).
 *
 * Requirements:
 *  - Individual fields for first_name, second_name, first_lastname, second_lastname.
 *  - Only emails from the institutional domain, with an instant error.
 *  - Live indicator of the password rules.
 *  - The terms checkbox is required: without it the button stays disabled.
 *  - Errors for existing email or username come from the API.
 *  - On success, redirects to /verify-email to confirm the 6-digit OTP code.
 */

import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import PasswordRules from '../../components/forms/PasswordRules.jsx';
import { useAuth } from '../../context/authContext.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';
import {
  INSTITUTIONAL_DOMAIN,
  passwordErrors,
  isInstitutionalEmail,
  isValidEmail,
  isValidUsername,
} from '../../utils/validations.js';

const SEMESTERS = Array.from({ length: 9 }, (_, index) => index + 1);

const INITIAL_VALUES = {
  first_name: '',
  second_name: '',
  first_lastname: '',
  second_lastname: '',
  username: '',
  email: '',
  password: '',
  confirm: '',
  semester: '',
};

/** Form fields that are validated. */
const FIELDS = [
  'first_name',
  'second_name',
  'first_lastname',
  'second_lastname',
  'username',
  'email',
  'password',
  'confirm',
  'semester',
];

/**
 * Validates the form on the client before calling the service.
 * @param {typeof INITIAL_VALUES} values
 * @returns {Record<string, string>}
 */
function validate(values) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (!values.first_name.trim()) {
    errors.first_name = 'El primer nombre es obligatorio.';
  }

  if (!values.first_lastname.trim()) {
    errors.first_lastname = 'El primer apellido es obligatorio.';
  }

  if (!values.second_lastname.trim()) {
    errors.second_lastname = 'El segundo apellido es obligatorio.';
  }

  if (!isValidUsername(values.username)) {
    errors.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.';
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'Escribe un correo válido.';
  } else if (!isInstitutionalEmail(values.email)) {
    errors.email = `Debes usar tu correo institucional ${INSTITUTIONAL_DOMAIN}.`;
  }

  if (passwordErrors(values.password).length > 0) {
    errors.password = 'La contraseña todavía no cumple todas las reglas.';
  }

  if (values.password !== values.confirm) {
    errors.confirm = 'Las contraseñas no coinciden.';
  }

  return errors;
}

/**
 * Copies the errors object without a field.
 * @param {Record<string, string>} errors
 * @param {string} field
 * @returns {Record<string, string>}
 */
function withoutField(errors, field) {
  if (!errors[field]) return errors;

  const next = { ...errors };
  delete next[field];
  return next;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touched, setTouched] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [apiErrors, setApiErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = validate(values);

  /**
   * The email already looks like an email but is not institutional: warn
   * right away, without waiting for the user to leave the field.
   */
  const emailOutsideDomain =
    isValidEmail(values.email) && !isInstitutionalEmail(values.email);

  /**
   * Visible error of a field. The API one wins; if there is none, the
   * validation one is shown once the field was touched (or earlier, for the domain).
   * @param {string} field
   * @returns {string|undefined}
   */
  const errorFor = (field) => {
    if (apiErrors[field]) return apiErrors[field];

    const shouldShow = touched[field] || (field === 'email' && emailOutsideDomain);
    return shouldShow ? validationErrors[field] : undefined;
  };

  /**
   * Updates a field and clears the API error while the user fixes it.
   * @param {string} field
   */
  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [field]: value }));
    setApiErrors((previous) => withoutField(previous, field));
  };

  /** Marks the field as touched on blur, to show its errors. */
  const markTouched = (field) => () =>
    setTouched((previous) => ({ ...previous, [field]: true }));

  /** On password blur: mark it touched and let PasswordRules hide itself. */
  const handlePasswordBlur = () => {
    markTouched('password')();
    setPasswordFocused(false);
  };

  const toggleTerms = (event) => setAcceptsTerms(event.target.checked);

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

      const result = await register({
        first_name: values.first_name.trim(),
        second_name: values.second_name.trim(),
        first_lastname: values.first_lastname.trim(),
        second_lastname: values.second_lastname.trim(),
        username: values.username,
        email: values.email,
        password: values.password,
        semester: values.semester === '' ? null : Number(values.semester),
      });

      if (result?.requiresVerification) {
        navigate('/verify-email', {
          replace: true,
          state: {
            email: values.email.trim().toLowerCase(),
            notice: result.message,
            resendCooldownSeconds: result.resendCooldownSeconds ?? 60,
            testCode: result.testCode ?? null,
          },
        });
        return;
      }

      navigate('/', { replace: true });
    } catch (error) {
      if (error?.fields) {
        setApiErrors((previous) => ({ ...previous, ...error.fields }));
      }
      setGeneralError(error?.message ?? 'No se pudo crear la cuenta. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Crear cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completa tus datos personales y usa tu correo institucional para registrarte.
          </Typography>
        </Box>

        {generalError && <Alert severity="error">{generalError}</Alert>}

        {/* ── Nombres (Primer y Segundo) ────────────────────────────── */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Primer nombre"
              value={values.first_name}
              onChange={handleChange('first_name')}
              onBlur={markTouched('first_name')}
              error={Boolean(errorFor('first_name'))}
              helperText={errorFor('first_name')}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Segundo nombre"
              value={values.second_name}
              onChange={handleChange('second_name')}
              onBlur={markTouched('second_name')}
              helperText="Opcional"
              fullWidth
            />
          </Grid>
        </Grid>

        {/* ── Apellidos (Primer y Segundo) ──────────────────────────── */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Primer apellido"
              value={values.first_lastname}
              onChange={handleChange('first_lastname')}
              onBlur={markTouched('first_lastname')}
              error={Boolean(errorFor('first_lastname'))}
              helperText={errorFor('first_lastname')}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Segundo apellido"
              value={values.second_lastname}
              onChange={handleChange('second_lastname')}
              onBlur={markTouched('second_lastname')}
              error={Boolean(errorFor('second_lastname'))}
              helperText={errorFor('second_lastname')}
              required
              fullWidth
            />
          </Grid>
        </Grid>

        {/* ── Usuario y Correo Institucional ───────────────────────── */}
        <TextField
          label="Nombre de usuario"
          value={values.username}
          onChange={handleChange('username')}
          onBlur={markTouched('username')}
          error={Boolean(errorFor('username'))}
          helperText={errorFor('username') ?? 'Así te verán los demás. Sin espacios.'}
          autoComplete="username"
          fullWidth
        />

        <TextField
          label="Correo institucional"
          type="email"
          value={values.email}
          onChange={handleChange('email')}
          onBlur={markTouched('email')}
          error={Boolean(errorFor('email'))}
          helperText={errorFor('email') ?? `Debe terminar en ${INSTITUTIONAL_DOMAIN}`}
          autoComplete="email"
          fullWidth
        />

        {/* ── Contraseña y confirmación ────────────────────────────── */}
        <Box>
          <TextField
            label="Contraseña"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            onFocus={() => setPasswordFocused(true)}
            onBlur={handlePasswordBlur}
            error={Boolean(errorFor('password'))}
            helperText={errorFor('password')}
            autoComplete="new-password"
            fullWidth
          />
          <PasswordRules password={values.password} focused={passwordFocused} />
        </Box>

        <TextField
          label="Confirmar contraseña"
          type="password"
          value={values.confirm}
          onChange={handleChange('confirm')}
          onBlur={markTouched('confirm')}
          error={Boolean(errorFor('confirm'))}
          helperText={errorFor('confirm')}
          autoComplete="new-password"
          fullWidth
        />

        {/* ── Semestre ─────────────────────────────────────────────── */}
        <TextField
          select
          label="Semestre"
          value={values.semester}
          onChange={handleChange('semester')}
          helperText="Opcional. Nos ayuda a sugerirte materias."
          slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
          fullWidth
        >
          <MenuItem value="">Sin especificar</MenuItem>
          {SEMESTERS.map((semester) => (
            <MenuItem key={semester} value={semester}>
              {`Semestre ${semester}`}
            </MenuItem>
          ))}
        </TextField>

        {/* ── Normas de uso ────────────────────────────────────────── */}
        <FormControlLabel
          control={<Checkbox checked={acceptsTerms} onChange={toggleTerms} />}
          label={
            <Typography variant="body2">
              Acepto las{' '}
              <Link component={RouterLink} to="/terms">
                normas de uso
              </Link>
            </Typography>
          }
        />

        <Button type="submit" size="large" disabled={!acceptsTerms || isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>

        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Link component={RouterLink} to="/login">
            Inicia sesión
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
