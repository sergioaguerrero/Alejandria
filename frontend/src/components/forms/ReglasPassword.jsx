/**
 * @file ReglasPassword.jsx
 * @description Indicador en vivo de las reglas de contraseña.
 *
 * Se usa en el registro (vista 2) y en el cambio de contraseña del perfil
 * (vista 14). Cada regla se marca cuando la contraseña escrita ya la cumple.
 */

import { Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/** Reglas del enunciado: 8 caracteres, una mayúscula, una minúscula y un número. */
const REGLAS = [
  { clave: 'longitud', texto: 'Mínimo 8 caracteres', cumple: (valor) => valor.length >= 8 },
  { clave: 'mayuscula', texto: 'Una letra mayúscula', cumple: (valor) => /[A-Z]/.test(valor) },
  { clave: 'minuscula', texto: 'Una letra minúscula', cumple: (valor) => /[a-z]/.test(valor) },
  { clave: 'numero', texto: 'Un número', cumple: (valor) => /\d/.test(valor) },
];

/**
 * @param {object} props
 * @param {string} props.password  Contraseña que se está escribiendo.
 */
export default function ReglasPassword({ password = '' }) {
  return (
    <Stack component="ul" spacing={0.5} sx={{ m: 0, mt: 1, pl: 0, listStyle: 'none' }}>
      {REGLAS.map(({ clave, texto, cumple }) => {
        const cumplida = cumple(String(password));

        return (
          <Stack
            key={clave}
            component="li"
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            {cumplida ? (
              <CheckCircleIcon fontSize="inherit" color="success" />
            ) : (
              <RadioButtonUncheckedIcon fontSize="inherit" sx={{ color: 'text.disabled' }} />
            )}

            <Typography variant="caption" sx={{ color: cumplida ? 'success.main' : 'text.secondary' }}>
              {texto}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
