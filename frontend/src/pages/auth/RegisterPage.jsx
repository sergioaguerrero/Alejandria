/**
 * @file RegisterPage.jsx
 * @description Vista 2 — Registro de estudiantes (FE-04, endpoint BE-05).
 *
 * Reglas del enunciado:
 *  - Solo correos del dominio institucional, con error al instante.
 *  - Indicador en vivo de las reglas de contraseña.
 *  - La casilla de normas es obligatoria: sin ella el botón queda deshabilitado.
 *  - Los errores de correo o usuario ya existentes llegan desde la API.
 */

import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import ReglasPassword from '../../components/forms/ReglasPassword.jsx';
import { useAuth } from '../../context/authContext.js';
import {
  DOMINIO_INSTITUCIONAL,
  erroresDePassword,
  esCorreoInstitucional,
  esCorreoValido,
  esUsernameValido,
} from '../../utils/validaciones.js';

const SEMESTRES = Array.from({ length: 10 }, (_, indice) => indice + 1);

const VALORES_INICIALES = {
  nombre: '',
  username: '',
  correo: '',
  password: '',
  confirmar: '',
  semestre: '',
};

/**
 * Valida el formulario en el cliente antes de llamar al servicio.
 * @param {typeof VALORES_INICIALES} valores
 * @returns {Record<string, string>}
 */
function validar(valores) {
  /** @type {Record<string, string>} */
  const errores = {};

  if (String(valores.nombre).trim().length < 3) {
    errores.nombre = 'Escribe tu nombre completo.';
  }

  if (!esUsernameValido(valores.username)) {
    errores.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.';
  }

  if (!esCorreoValido(valores.correo)) {
    errores.correo = 'Escribe un correo válido.';
  } else if (!esCorreoInstitucional(valores.correo)) {
    errores.correo = `Debes usar tu correo institucional ${DOMINIO_INSTITUCIONAL}.`;
  }

  if (erroresDePassword(valores.password).length > 0) {
    errores.password = 'La contraseña todavía no cumple todas las reglas.';
  }

  if (valores.password !== valores.confirmar) {
    errores.confirmar = 'Las contraseñas no coinciden.';
  }

  return errores;
}

export default function RegisterPage() {
  const navegar = useNavigate();
  const { registro } = useAuth();

  const [valores, setValores] = useState(VALORES_INICIALES);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [erroresCampos, setErroresCampos] = useState(/** @type {Record<string, string>} */ ({}));
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  /**
   * Actualiza un campo y borra su error mientras el usuario lo corrige.
   * @param {'nombre'|'username'|'correo'|'password'|'confirmar'|'semestre'} campo
   */
  const cambiar = (campo) => (evento) => {
    const { value } = evento.target;
    setValores((previos) => ({ ...previos, [campo]: value }));

    setErroresCampos((previos) => {
      if (!previos[campo]) return previos;
      const siguientes = { ...previos };
      delete siguientes[campo];
      return siguientes;
    });
  };

  const alternarTerminos = (evento) => {
    setAceptaTerminos(evento.target.checked);

    setErroresCampos((previos) => {
      if (!previos.terminos) return previos;
      const siguientes = { ...previos };
      delete siguientes.terminos;
      return siguientes;
    });
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral('');

    const errores = validar(valores);

    if (!aceptaTerminos) {
      errores.terminos = 'Debes aceptar las normas de uso.';
    }

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      return;
    }

    try {
      setEnviando(true);

      await registro({
        nombre: valores.nombre,
        username: valores.username,
        correo: valores.correo,
        password: valores.password,
        semestre: valores.semestre === '' ? null : Number(valores.semestre),
      });

      // TODO(FE-06): llevar a Mis materias de interés (vista 15) con las
      // materias del semestre preseleccionadas.
      navegar('/', { replace: true });
    } catch (error) {
      if (error?.campos) {
        setErroresCampos((previos) => ({ ...previos, ...error.campos }));
      }
      setErrorGeneral(error?.message ?? 'No se pudo crear la cuenta. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box component="form" onSubmit={enviar} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Crear cuenta
          </Typography>
          <Typography variant="body2">
            Usa tu correo institucional para registrarte.
          </Typography>
        </Box>

        {errorGeneral && <Alert severity="error">{errorGeneral}</Alert>}

        <TextField
          label="Nombre completo"
          value={valores.nombre}
          onChange={cambiar('nombre')}
          error={Boolean(erroresCampos.nombre)}
          helperText={erroresCampos.nombre}
          autoComplete="name"
        />

        <TextField
          label="Nombre de usuario"
          value={valores.username}
          onChange={cambiar('username')}
          error={Boolean(erroresCampos.username)}
          helperText={erroresCampos.username ?? 'Así te verán los demás. Sin espacios.'}
          autoComplete="username"
        />

        <TextField
          label="Correo institucional"
          type="email"
          value={valores.correo}
          onChange={cambiar('correo')}
          error={Boolean(erroresCampos.correo)}
          helperText={erroresCampos.correo ?? `Debe terminar en ${DOMINIO_INSTITUCIONAL}`}
          autoComplete="email"
        />

        <Box>
          <TextField
            label="Contraseña"
            type="password"
            value={valores.password}
            onChange={cambiar('password')}
            error={Boolean(erroresCampos.password)}
            helperText={erroresCampos.password}
            autoComplete="new-password"
          />
          <ReglasPassword password={valores.password} />
        </Box>

        <TextField
          label="Confirmar contraseña"
          type="password"
          value={valores.confirmar}
          onChange={cambiar('confirmar')}
          error={Boolean(erroresCampos.confirmar)}
          helperText={erroresCampos.confirmar}
          autoComplete="new-password"
        />

        <TextField
          select
          label="Semestre"
          value={valores.semestre}
          onChange={cambiar('semestre')}
          helperText="Opcional. Nos ayuda a sugerirte materias."
        >
          <MenuItem value="">Sin especificar</MenuItem>
          {SEMESTRES.map((semestre) => (
            <MenuItem key={semestre} value={semestre}>
              {`Semestre ${semestre}`}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <FormControlLabel
            control={<Checkbox checked={aceptaTerminos} onChange={alternarTerminos} />}
            label={
              <Typography variant="body2">
                Acepto las{' '}
                <Link component={RouterLink} to="/normas">
                  normas de uso
                </Link>
              </Typography>
            }
          />
          {erroresCampos.terminos && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>
              {erroresCampos.terminos}
            </Typography>
          )}
        </Box>

        <Button type="submit" size="large" disabled={!aceptaTerminos || enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
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
