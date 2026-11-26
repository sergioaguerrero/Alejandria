/**
 * @file ProfileImageLightbox.jsx
 * @description Clean lightbox dialog to inspect a user's profile picture or banner enlarged.
 */

import {
  Box,
  Dialog,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {'avatar'|'banner'} props.kind
 * @param {string|undefined} props.src
 * @param {string} [props.label]
 * @param {() => void} props.onClose
 */
export default function ProfileImageLightbox({
  open,
  kind,
  src,
  label = '',
  onClose,
}) {
  const isBanner = kind === 'banner';

  return (
    <Dialog
      open={open && Boolean(src)}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(6, 10, 20, 0.84)',
            backdropFilter: 'blur(6px)',
          },
        },
        paper: {
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
            m: { xs: 2, sm: 3 },
            maxWidth: isBanner ? 'min(92vw, 1060px)' : 'min(88vw, 520px)',
          },
        },
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ color: '#F8FAFC', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
          >
            {label || (isBanner ? 'Banner de perfil' : 'Foto de perfil')}
          </Typography>

          <IconButton
            size="small"
            aria-label="Cerrar vista ampliada"
            onClick={onClose}
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.78)',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          component="img"
          src={src}
          alt={label || (isBanner ? 'Banner de perfil ampliado' : 'Foto de perfil ampliada')}
          sx={{
            display: 'block',
            width: isBanner ? 'min(92vw, 1060px)' : 'min(86vw, 480px)',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: isBanner ? 3 : '50%',
            border: '2px solid rgba(255,255,255,0.18)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
            bgcolor: '#0B1220',
          }}
        />
      </Stack>
    </Dialog>
  );
}
