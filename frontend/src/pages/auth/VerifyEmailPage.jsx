/**
 * @file VerifyEmailPage.jsx
 * @description View — Institutional email confirmation with 6-digit OTP code.
 */

import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import { useAuth } from '../../context/authContext.js';
import {
  INSTITUTIONAL_DOMAIN,
  isInstitutionalEmail,
  isValidEmail,
  isValidVerificationCode,
} from '../../utils/validations.js';

const OTP_LENGTH = 6;
const EMPTY_DIGITS = Array(OTP_LENGTH).fill('');

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();

  const initialEmail = String(
    location.state?.email ?? searchParams.get('email') ?? '',
  )
    .trim()
    .toLowerCase();

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(EMPTY_DIGITS);
  const [cooldown, setCooldown] = useState(
    Number(location.state?.resendCooldownSeconds ?? (initialEmail ? 60 : 0)),
  );
  const [notice, setNotice] = useState(String(location.state?.notice ?? ''));
  const [testCode, setTestCode] = useState(location.state?.testCode ?? null);
  const [generalError, setGeneralError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  /** @type {import('react').MutableRefObject<Array<HTMLInputElement|null>>} */
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (initialEmail) {
      inputRefs.current[0]?.focus();
    }
  }, [initialEmail]);

  const combinedCode = digits.join('');

  const handleDigitChange = (index) => (event) => {
    const raw = event.target.value.replace(/\D/g, '');
    setGeneralError('');
    setCodeError('');

    if (raw.length > 1) {
      const next = [...digits];
      for (let offset = 0; offset < raw.length && index + offset < OTP_LENGTH; offset += 1) {
        next[index + offset] = raw[offset];
      }
      setDigits(next);
      const focusTarget = Math.min(index + raw.length, OTP_LENGTH - 1);
      inputRefs.current[focusTarget]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = raw;
    setDigits(next);

    if (raw && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index) => (event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      event.preventDefault();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setGeneralError('');
    setCodeError('');
    const next = Array.from({ length: OTP_LENGTH }, (_, idx) => pasted[idx] ?? '');
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const fillDemoCode = () => {
    if (!testCode) return;
    const clean = String(testCode).slice(0, OTP_LENGTH).split('');
    setDigits(Array.from({ length: OTP_LENGTH }, (_, idx) => clean[idx] ?? ''));
    setGeneralError('');
    setCodeError('');
  };

  const validateInputs = () => {
    const cleanEmail = email.trim().toLowerCase();
    let valid = true;

    if (!isValidEmail(cleanEmail) || !isInstitutionalEmail(cleanEmail)) {
      setEmailError(`Debes usar tu correo institucional ${INSTITUTIONAL_DOMAIN}.`);
      valid = false;
    } else {
      setEmailError('');
    }

    if (!isValidVerificationCode(combinedCode)) {
      setCodeError('Ingresa los 6 dígitos numéricos del código.');
      valid = false;
    } else {
      setCodeError('');
    }

    return valid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGeneralError('');
    setErrorCode('');

    if (!validateInputs()) return;

    try {
      setIsSubmitting(true);
      const result = await verifyEmail({
        email: email.trim().toLowerCase(),
        code: combinedCode,
      });

      if (result?.token) {
        navigate('/', { replace: true });
        return;
      }

      navigate('/login', {
        replace: true,
        state: { notice: 'Correo verificado exitosamente. Ya puedes iniciar sesión.' },
      });
    } catch (error) {
      setErrorCode(error?.code ?? '');
      if (error?.fields?.email) setEmailError(error.fields.email);
      if (error?.fields?.code) setCodeError(error.fields.code);
      setGeneralError(error?.message ?? 'No se pudo verificar el código. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setGeneralError('');
    setErrorCode('');
    setNotice('');

    if (!isValidEmail(cleanEmail) || !isInstitutionalEmail(cleanEmail)) {
      setEmailError(`Debes usar tu correo institucional ${INSTITUTIONAL_DOMAIN}.`);
      return;
    }
    setEmailError('');

    try {
      setIsResending(true);
      const response = await resendVerificationCode(cleanEmail);
      setNotice(response?.message ?? 'Enviamos un nuevo código a tu correo institucional.');
      setCooldown(Number(response?.resendCooldownSeconds ?? 60));
      setDigits(EMPTY_DIGITS);
      if (response?.testCode) {
        setTestCode(response.testCode);
      }
      inputRefs.current[0]?.focus();
    } catch (error) {
      setErrorCode(error?.code ?? '');
      const retryAfter = Number(error?.meta?.retryAfterSeconds ?? 0);
      if (retryAfter > 0) {
        setCooldown(retryAfter);
      }
      setGeneralError(error?.message ?? 'No se pudo reenviar el código. Intenta más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <MarkEmailReadOutlinedIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              Confirma tu correo
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Ingresa el código de 6 dígitos que enviamos a tu correo institucional para activar tu cuenta.
          </Typography>
        </Box>

        {notice && !generalError && <Alert severity="success">{notice}</Alert>}

        {generalError && (
          <Alert
            severity={errorCode === 'ALREADY_VERIFIED' ? 'info' : 'error'}
            action={
              errorCode === 'ALREADY_VERIFIED' ? (
                <Button component={RouterLink} to="/login" color="inherit" size="small">
                  Ir al login
                </Button>
              ) : null
            }
          >
            {generalError}
          </Alert>
        )}

        {testCode && (
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
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tu código de verificación es <strong>{testCode}</strong>
            </Typography>
            <Button size="small" variant="outlined" onClick={fillDemoCode} sx={{ mt: 1 }}>
              Completar código automáticamente
            </Button>
          </Box>
        )}

        <TextField
          label="Correo institucional"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError('');
            setGeneralError('');
          }}
          error={Boolean(emailError)}
          helperText={emailError || `Debe terminar en ${INSTITUTIONAL_DOMAIN}`}
          autoComplete="email"
          fullWidth
        />

        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Código de verificación
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            onPaste={handlePaste}
            sx={{ justifyContent: 'space-between' }}
          >
            {digits.map((digit, index) => (
              <TextField
                key={index}
                value={digit}
                onChange={handleDigitChange(index)}
                onKeyDown={handleDigitKeyDown(index)}
                inputRef={(el) => {
                  inputRefs.current[index] = el;
                }}
                error={Boolean(codeError)}
                slotProps={{
                  htmlInput: {
                    maxLength: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    'aria-label': `Dígito ${index + 1} de ${OTP_LENGTH}`,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      padding: '12px 0',
                    },
                  },
                }}
                sx={{ width: 52 }}
              />
            ))}
          </Stack>
          <Typography
            variant="caption"
            color={codeError ? 'error.main' : 'text.secondary'}
            sx={{ display: 'block', mt: 0.75 }}
          >
            {codeError || 'Expira en 15 minutos. También puedes pegar los 6 dígitos completos.'}
          </Typography>
        </Box>

        <Button
          type="submit"
          size="large"
          variant="contained"
          disabled={isSubmitting}
          startIcon={<VerifiedUserOutlinedIcon />}
        >
          {isSubmitting ? 'Verificando…' : 'Confirmar correo'}
        </Button>

        <Button
          type="button"
          variant="outlined"
          disabled={isResending || cooldown > 0}
          onClick={handleResend}
          startIcon={<RefreshIcon />}
        >
          {isResending
            ? 'Enviando nuevo código…'
            : cooldown > 0
              ? `Reenviar código en ${cooldown}s`
              : 'Reenviar código'}
        </Button>

        <Stack spacing={1} sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            ¿Ya confirmaste tu cuenta?{' '}
            <Link component={RouterLink} to="/login">
              Inicia sesión
            </Link>
          </Typography>
          <Typography variant="body2">
            ¿Te equivocaste de correo?{' '}
            <Link component={RouterLink} to="/register">
              Volver al registro
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
