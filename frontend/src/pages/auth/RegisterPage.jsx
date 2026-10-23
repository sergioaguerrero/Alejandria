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

/** Campos del formulario que se validan. */
const CAMPOS = ['nombre', 'username', 'correo', 'password', 'confirmar', 'semestre'];

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

/**
 * Copia el objeto de errores sin un campo.
 * @param {Record<string, string>} errores
 * @param {string} campo
 * @returns {Record<string, string>}
 */
function sinCampo(errores, campo) {
  if (!errores[campo]) return errores;

  const siguientes = { ...errores };
  delete siguientes[campo];
  return siguientes;
}

export default function RegisterPage() {
  const navegar = useNavigate();
  const { registro } = useAuth();

  const [valores, setValores] = useState(VALORES_INICIALES);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [tocados, setTocados] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [erroresApi, setErroresApi] = useState(/** @type {Record<string, string>} */ ({}));
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const erroresValidacion = validar(valores);

  /**
   * El correo ya tiene forma de correo pero no es institucional: se avisa
   * en el momento, sin esperar a que el usuario salga del campo.
   */
  const correoFueraDeDominio =
    esCorreoValido(valores.correo) && !esCorreoInstitucional(valores.correo);

  /**
   * Error visible de un campo. El de la API manda; si no hay, se muestra el
   * de validación cuando el campo ya fue tocado (o antes, para el dominio).
   * @param {string} campo
   * @returns {string|undefined}
   */
  const errorDe = (campo) => {
    if (erroresApi[campo]) return erroresApi[campo];

    const mostrar = tocados[campo] || (campo === 'correo' && correoFueraDeDominio);
    return mostrar ? erroresValidacion[campo] : undefined;
  };

  /**
   * Actualiza un campo y borra el error de la API mientras el usuario lo corrige.
   * @param {string} campo
   */
  const cambiar = (campo) => (evento) => {
    const { value } = evento.target;
    setValores((previos) => ({ ...previos, [campo]: value }));
    setErroresApi((previos) => sinCampo(previos, campo));
  };

  /** Marca el campo como tocado al salir de él, para mostrar sus errores. */
  const marcarTocado = (campo) => () =>
    setTocados((previos) => ({ ...previos, [campo]: true }));

  const alternarTerminos = (evento) => setAceptaTerminos(evento.target.checked);

  const enviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral('');

    // Al enviar ya se muestran los errores de todos los campos.
    setTocados(Object.fromEntries(CAMPOS.map((campo) => [campo, true])));

    if (Object.keys(erroresValidacion).length > 0) {
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
        setErroresApi((previos) => ({ ...previos, ...error.campos }));
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
          onBlur={marcarTocado('nombre')}
          error={Boolean(errorDe('nombre'))}
          helperText={errorDe('nombre')}
          autoComplete="name"
        />

        <TextField
          label="Nombre de usuario"
          value={valores.username}
          onChange={cambiar('username')}
          onBlur={marcarTocado('username')}
          error={Boolean(errorDe('username'))}
          helperText={errorDe('username') ?? 'Así te verán los demás. Sin espacios.'}
          autoComplete="username"
        />

        <TextField
          label="Correo institucional"
          type="email"
          value={valores.correo}
          onChange={cambiar('correo')}
          onBlur={marcarTocado('correo')}
          error={Boolean(errorDe('correo'))}
          helperText={errorDe('correo') ?? `Debe terminar en ${DOMINIO_INSTITUCIONAL}`}
          autoComplete="email"
        />

        <Box>
          <TextField
            label="Contraseña"
            type="password"
            value={valores.password}
            onChange={cambiar('password')}
            onBlur={marcarTocado('password')}
            error={Boolean(errorDe('password'))}
            helperText={errorDe('password')}
            autoComplete="new-password"
          />
          <ReglasPassword password={valores.password} />
        </Box>

        <TextField
          label="Confirmar contraseña"
          type="password"
          value={valores.confirmar}
          onChange={cambiar('confirmar')}
          onBlur={marcarTocado('confirmar')}
          error={Boolean(errorDe('confirmar'))}
          helperText={errorDe('confirmar')}
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
