/**
 * @file ProfilePage.jsx
 * @description View 14 — My profile (FE-07, endpoint BE-08).
 *
 * The student and the admin can edit their name, username and semester, and
 * change their password. The email is shown but cannot be edited. Every action
 * reports its result in a notice.
 */

import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';

import { useAuth } from '../../context/authContext.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';

const SEMESTERS = Array.from({ length: 9 }, (_, index) => index + 1);

/** Turns the `fields` object of an ApiError into form errors. */
const emptyFields = () => ({ name: '', username: '', semester: '' });
const emptyPasswordFields = () => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export default function ProfilePage() {
  const { user, isAdmin, updateProfile, changePassword } = useAuth();

  const [values, setValues] = useState(() => ({
    name: user?.name ?? '',
    username: user?.username ?? '',
    semester: user?.semester ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState(emptyFields);
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState(emptyPasswordFields);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState(emptyPasswordFields);
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [notice, setNotice] = useState(null);

  const handleValueChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswords((current) => ({ ...current, [field]: event.target.value }));
    setPasswordFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');
    setFieldErrors(emptyFields());
    setIsSavingProfile(true);

    try {
      await updateProfile({
        name: values.name,
        username: values.username,
        semester: isAdmin || values.semester === '' ? null : Number(values.semester),
      });
      setNotice({ severity: 'success', message: 'Tus datos se actualizaron.' });
    } catch (serviceError) {
      if (serviceError?.fields) {
        setFieldErrors((current) => ({ ...current, ...serviceError.fields }));
      } else {
        setProfileError(serviceError?.message ?? 'No se pudieron guardar tus datos.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordFieldErrors(emptyPasswordFields());
    setIsSavingPassword(true);

    try {
      if (passwords.newPassword !== passwords.confirmPassword) {
        setPasswordFieldErrors((current) => ({
          ...current,
          confirmPassword: 'La confirmación no coincide con la nueva contraseña.',
        }));
        return;
      }

      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords(emptyPasswordFields());
      setNotice({ severity: 'success', message: 'Tu contraseña se actualizó.' });
    } catch (serviceError) {
      if (serviceError?.fields) {
        setPasswordFieldErrors((current) => ({ ...current, ...serviceError.fields }));
      } else {
        setPasswordError(serviceError?.message ?? 'No se pudo cambiar la contraseña.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Mi perfil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administra tus datos personales y la seguridad de tu cuenta.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
          alignItems: 'start',
        }}
      >
        <Stack spacing={3}>
          {/* ── Personal data ─────────────────────────────────────────── */}
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <BadgeOutlinedIcon color="primary" />
                  <Typography variant="h6" component="h2">
                    Datos personales
                  </Typography>
                </Stack>

                <Divider />

                {profileError && <Alert severity="error">{profileError}</Alert>}

                <Box component="form" onSubmit={handleProfileSubmit} noValidate>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Nombre completo"
                      value={values.name}
                      onChange={handleValueChange('name')}
                      error={Boolean(fieldErrors.name)}
                      helperText={fieldErrors.name || 'Se usa solo para tu cuenta, no aparece en tu perfil público.'}
                      required
                      fullWidth
                      disabled={isSavingProfile}
                    />

                    <TextField
                      label="Nombre de usuario"
                      value={values.username}
                      onChange={handleValueChange('username')}
                      error={Boolean(fieldErrors.username)}
                      helperText={fieldErrors.username || 'Es el @usuario que ven los demás.'}
                      required
                      fullWidth
                      disabled={isSavingProfile}
                      slotProps={{ input: { startAdornment: <Typography color="text.secondary">@</Typography> } }}
                    />

                    {!isAdmin && (
                      <TextField
                        select
                        label="Semestre"
                        value={values.semester}
                        onChange={handleValueChange('semester')}
                        error={Boolean(fieldErrors.semester)}
                        helperText={fieldErrors.semester || 'Se usa para sugerirte materias de interés.'}
                        required
                        fullWidth
                        disabled={isSavingProfile}
                        slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
                      >
                        {SEMESTERS.map((semester) => (
                          <MenuItem key={semester} value={semester}>
                            {`Semestre ${semester}`}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    <TextField
                      label="Correo institucional"
                      value={user?.email ?? ''}
                      helperText="El correo institucional no se puede editar."
                      fullWidth
                      disabled
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? 'Guardando…' : 'Guardar cambios'}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* ── Password ──────────────────────────────────────────────── */}
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <LockOutlinedIcon color="primary" />
                  <Typography variant="h6" component="h2">
                    Cambiar contraseña
                  </Typography>
                </Stack>

                <Divider />

                {passwordError && <Alert severity="error">{passwordError}</Alert>}

                <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Contraseña actual"
                      type="password"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      error={Boolean(passwordFieldErrors.currentPassword)}
                      helperText={passwordFieldErrors.currentPassword}
                      autoComplete="current-password"
                      required
                      fullWidth
                      disabled={isSavingPassword}
                    />

                    <TextField
                      label="Nueva contraseña"
                      type="password"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      error={Boolean(passwordFieldErrors.newPassword)}
                      helperText={
                        passwordFieldErrors.newPassword ||
                        'Mínimo 8 caracteres, con mayúscula, minúscula y número.'
                      }
                      autoComplete="new-password"
                      required
                      fullWidth
                      disabled={isSavingPassword}
                    />

                    <TextField
                      label="Confirmar nueva contraseña"
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      error={Boolean(passwordFieldErrors.confirmPassword)}
                      helperText={passwordFieldErrors.confirmPassword}
                      autoComplete="new-password"
                      required
                      fullWidth
                      disabled={isSavingPassword}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="outlined"
                        startIcon={<LockOutlinedIcon />}
                        disabled={isSavingPassword}
                      >
                        {isSavingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* ── Side summary ────────────────────────────────────────────── */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Tu cuenta
              </Typography>

              <Divider />

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Usuario
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {`@${user?.username ?? ''}`}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Correo
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {user?.email}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Rol
                </Typography>
                <Chip
                  label={isAdmin ? 'Administrador' : 'Estudiante'}
                  size="small"
                  color={isAdmin ? 'secondary' : 'default'}
                />
              </Stack>

              <Divider />

              <Button
                component={RouterLink}
                to="/my-subjects"
                variant="outlined"
                startIcon={<BookmarkBorderOutlinedIcon />}
              >
                Mis materias de interés
              </Button>

              <Button
                component={RouterLink}
                to={`/users/${user?.username ?? ''}`}
                variant="text"
                startIcon={<PersonIcon />}
              >
                Ver mi perfil público
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
      >
        <Alert
          severity={notice?.severity ?? 'success'}
          variant="filled"
          onClose={() => setNotice(null)}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
