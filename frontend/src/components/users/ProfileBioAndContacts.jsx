/**
 * @file ProfileBioAndContacts.jsx
 * @description Renders the user's profile description (bio) and interactive
 * contact methods on both private and public profiles.
 */

import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { resolveContactAction } from '../../utils/contactMethods.js';

function AddSectionButton({ label, onClick }) {
  return (
    <Tooltip title={label}>
      <Button
        size="small"
        variant="outlined"
        aria-label={label}
        onClick={onClick}
        sx={{ minWidth: 36, width: 36, height: 36, p: 0, flexShrink: 0 }}
      >
        <AddIcon fontSize="small" />
      </Button>
    </Tooltip>
  );
}

/**
 * Returns the Material UI icon element for a contact method type.
 * @param {string} type
 */
export function ContactTypeIcon({ type, fontSize = 'small' }) {
  switch (String(type ?? '').toUpperCase()) {
    case 'WHATSAPP':
      return <WhatsAppIcon fontSize={fontSize} />;
    case 'EMAIL':
      return <EmailOutlinedIcon fontSize={fontSize} />;
    case 'INSTAGRAM':
      return <InstagramIcon fontSize={fontSize} />;
    case 'LINKEDIN':
      return <LinkedInIcon fontSize={fontSize} />;
    case 'GITHUB':
      return <GitHubIcon fontSize={fontSize} />;
    case 'TELEGRAM':
      return <SendOutlinedIcon fontSize={fontSize} />;
    case 'DISCORD':
      return <ForumOutlinedIcon fontSize={fontSize} />;
    case 'WEBSITE':
      return <LanguageOutlinedIcon fontSize={fontSize} />;
    default:
      return <AlternateEmailOutlinedIcon fontSize={fontSize} />;
  }
}

/**
 * @param {object} props
 * @param {string|null|undefined} props.bio
 * @param {Array<{ id?: number|string, type: string, value: string, label?: string|null }>} [props.contacts=[]]
 * @param {boolean} [props.isOwnProfile=false]
 * @param {(tab: 'profile'|'contacts') => void} [props.onEdit]
 * @param {(notice: { severity: 'success'|'error'|'info', message: string }) => void} [props.onNotice]
 */
export default function ProfileBioAndContacts({
  bio,
  contacts = [],
  isOwnProfile = false,
  onEdit,
  onNotice,
}) {
  const cleanBio = String(bio ?? '').trim();
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const hasBio = cleanBio.length > 0;
  const hasContacts = safeContacts.length > 0;

  if (!hasBio && !hasContacts && !isOwnProfile) {
    return null;
  }

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotice?.({
        severity: 'success',
        message: `${label} copiado al portapapeles.`,
      });
    } catch {
      onNotice?.({
        severity: 'info',
        message: `${label}: ${text}`,
      });
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 2.5,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
      }}
    >
      <Stack spacing={2}>
        {/* Description / Bio */}
        {hasBio ? (
          <Box>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: '0.08em', fontWeight: 700 }}
              >
                Sobre mí
              </Typography>
              {isOwnProfile && onEdit && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<EditOutlinedIcon fontSize="small" />}
                  onClick={() => onEdit('profile')}
                  sx={{ py: 0.25, px: 1, minHeight: 0 }}
                >
                  Editar descripción
                </Button>
              )}
            </Stack>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                whiteSpace: 'pre-line',
                lineHeight: 1.65,
                maxWidth: 780,
                wordBreak: 'break-word',
              }}
            >
              {cleanBio}
            </Typography>
          </Box>
        ) : (
          isOwnProfile &&
          onEdit && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                Aún no has agregado una descripción personal para tu perfil.
              </Typography>
              <AddSectionButton
                label="Agregar descripción"
                onClick={() => onEdit('profile')}
              />
            </Box>
          )
        )}

        {/* Contact Methods */}
        {hasContacts ? (
          <Box
            sx={{
              pt: hasBio || isOwnProfile ? 1.5 : 0,
              borderTop: hasBio || isOwnProfile ? 1 : 0,
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: '0.08em', fontWeight: 700 }}
              >
                Medios de contacto
              </Typography>
              {isOwnProfile && onEdit && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<EditOutlinedIcon fontSize="small" />}
                  onClick={() => onEdit('contacts')}
                  sx={{ py: 0.25, px: 1, minHeight: 0 }}
                >
                  Gestionar contactos
                </Button>
              )}
            </Stack>

            <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
              {safeContacts.map((contact, idx) => {
                const action = resolveContactAction(contact);
                const chipContent = (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ fontWeight: 700, color: 'text.primary' }}
                    >
                      {action.displayLabel}:
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {action.displayValue}
                    </Typography>
                  </Box>
                );

                return (
                  <Box
                    key={contact.id ?? `${action.type}-${idx}`}
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                  >
                    {action.href ? (
                      <Tooltip title={action.external ? 'Abrir enlace' : 'Enviar correo'}>
                        <Chip
                          component="a"
                          href={action.href}
                          target={action.external ? '_blank' : undefined}
                          rel={action.external ? 'noopener noreferrer' : undefined}
                          clickable
                          variant="outlined"
                          icon={<ContactTypeIcon type={action.type} />}
                          deleteIcon={<OpenInNewOutlinedIcon sx={{ fontSize: '0.95rem !important' }} />}
                          onDelete={
                            action.external
                              ? () => window.open(action.href, '_blank', 'noopener,noreferrer')
                              : undefined
                          }
                          label={chipContent}
                          sx={{
                            height: 'auto',
                            py: 0.65,
                            px: 0.5,
                            borderRadius: 2,
                            textDecoration: 'none',
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Copiar dato de contacto">
                        <Chip
                          clickable
                          variant="outlined"
                          icon={<ContactTypeIcon type={action.type} />}
                          onClick={() => handleCopy(action.copyText, action.displayLabel)}
                          label={chipContent}
                          sx={{
                            height: 'auto',
                            py: 0.65,
                            px: 0.5,
                            borderRadius: 2,
                          }}
                        />
                      </Tooltip>
                    )}

                    <Tooltip title={`Copiar ${action.displayLabel}`}>
                      <IconButton
                        size="small"
                        aria-label={`Copiar ${action.displayLabel}`}
                        onClick={() => handleCopy(action.copyText, action.displayLabel)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <ContentCopyOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : (
          isOwnProfile &&
          onEdit && (
            <Box
              sx={{
                pt: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                Agrega tus medios de contacto (WhatsApp, GitHub, LinkedIn, correo, etc.) para colaborar con otros estudiantes.
              </Typography>
              <AddSectionButton
                label="Agregar contactos"
                onClick={() => onEdit('contacts')}
              />
            </Box>
          )
        )}
      </Stack>
    </Paper>
  );
}
