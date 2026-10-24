/**
 * @file PasswordRules.jsx
 * @description Live indicator of the password rules.
 *
 * Used in registration (view 2) and in the profile password change
 * (view 14). Each rule is marked when the typed password already meets it.
 */

import { Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/** Rules from the statement: 8 characters, one uppercase, one lowercase and one number. */
const RULES = [
  { key: 'length', text: 'Mínimo 8 caracteres', isMet: (value) => value.length >= 8 },
  { key: 'uppercase', text: 'Una letra mayúscula', isMet: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', text: 'Una letra minúscula', isMet: (value) => /[a-z]/.test(value) },
  { key: 'number', text: 'Un número', isMet: (value) => /\d/.test(value) },
];

/**
 * @param {object} props
 * @param {string} props.password  Password being typed.
 */
export default function PasswordRules({ password = '' }) {
  return (
    <Stack component="ul" spacing={0.5} sx={{ m: 0, mt: 1, pl: 0, listStyle: 'none' }}>
      {RULES.map(({ key, text, isMet }) => {
        const fulfilled = isMet(String(password));

        return (
          <Stack
            key={key}
            component="li"
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            {fulfilled ? (
              <CheckCircleIcon fontSize="inherit" color="success" />
            ) : (
              <RadioButtonUncheckedIcon fontSize="inherit" sx={{ color: 'text.disabled' }} />
            )}

            <Typography variant="caption" sx={{ color: fulfilled ? 'success.main' : 'text.secondary' }}>
              {text}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
