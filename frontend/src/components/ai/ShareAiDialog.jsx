/**
 * @file ShareAiDialog.jsx
 * @description Modal dialog to share AI-generated study content exclusively
 * with mutual friends (FE-33, BE-38).
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

import EmptyState from '../common/EmptyState.jsx';
import {
  getFriends,
  getSharedFriendsForMaterial,
  shareAiContentWithFriends,
} from '../../services/index.js';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object|null} props.material
 * @param {() => void} props.onClose
 * @param {(result: { sharedCount: number, sharedWith: string[] }) => void} props.onShared
 */
export default function ShareAiDialog({ open, material, onClose, onShared }) {
  const [friends, setFriends] = useState([]);
  const [alreadyShared, setAlreadyShared] = useState([]);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const targetKey = open && material?.id ? material.id : '';
  const isLoading = Boolean(targetKey && loadedKey !== targetKey);

  useEffect(() => {
    if (!targetKey) return undefined;
    let active = true;

    Promise.all([getFriends(), getSharedFriendsForMaterial(targetKey)])
      .then(([friendsList, sharedList]) => {
        if (!active) return;
        setFriends(friendsList);
        setAlreadyShared(sharedList);
        setSelected([]);
        setNote('');
        setError('');
      })
      .catch((serviceError) => {
        if (!active) return;
        setError(serviceError?.message ?? 'No se pudo cargar tu lista de amigos.');
      })
      .finally(() => {
        if (active) setLoadedKey(targetKey);
      });

    return () => {
      active = false;
    };
  }, [targetKey]);

  const handleToggleFriend = (username) => {
    setSelected((prev) =>
      prev.includes(username) ? prev.filter((item) => item !== username) : [...prev, username],
    );
  };

  const handleSubmit = async () => {
    if (!material?.id) return;
    setError('');

    if (selected.length === 0) {
      setError('Selecciona al menos un amigo para compartir este contenido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await shareAiContentWithFriends(material.id, selected, note);
      setLoadedKey('');
      onShared?.(result);
      onClose?.();
    } catch (serviceError) {
      setError(serviceError?.message ?? 'No se pudo compartir el contenido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setLoadedKey('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Compartir contenido de IA con amigos</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {material && (
            <Typography variant="body2" color="text.secondary">
              Vas a compartir: <strong>{material.title}</strong>
            </Typography>
          )}

          <Alert severity="info" icon={<HandshakeOutlinedIcon />}>
            Opción exclusiva para amigos: solo los estudiantes con seguimiento mutuo pueden recibir
            tus materiales generados con IA.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : friends.length === 0 ? (
            <EmptyState
              icon={HandshakeOutlinedIcon}
              title="Aún no tienes amigos mutuos"
              description="Sigue a tus compañeros y espera a que te sigan de vuelta para poder compartir material de IA."
              action={
                <Button
                  component={RouterLink}
                  to="/friends"
                  variant="outlined"
                  size="small"
                  onClick={handleClose}
                >
                  Ir a Amigos
                </Button>
              }
            />
          ) : (
            <>
              <Typography variant="subtitle2" fontWeight={600}>
                Elige con quién compartir ({selected.length} seleccionados)
              </Typography>

              <List
                dense
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  maxHeight: 240,
                  overflowY: 'auto',
                  py: 0,
                }}
              >
                {friends.map((friend) => {
                  const checked = selected.includes(friend.username);
                  const wasSharedBefore = alreadyShared.includes(friend.username);

                  return (
                    <ListItemButton
                      key={friend.username}
                      onClick={() => handleToggleFriend(friend.username)}
                      disabled={isSubmitting}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1.5,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          bgcolor: 'success.main',
                          color: 'primary.contrastText',
                        }}
                      >
                        {friend.username.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={`@${friend.username}`}
                        secondary={
                          friend.semester ? `Semestre ${friend.semester}` : 'Estudiante UPC'
                        }
                      />
                      {wasSharedBefore && (
                        <Chip size="small" variant="outlined" color="success" label="Ya compartido" />
                      )}
                    </ListItemButton>
                  );
                })}
              </List>

              <TextField
                label="Nota para tus amigos (opcional)"
                placeholder="Ej. Úsalo para repasar antes del parcial del viernes."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                disabled={isSubmitting}
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="text" onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        {friends.length > 0 && (
          <Button
            variant="contained"
            startIcon={<ShareOutlinedIcon />}
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || selected.length === 0}
          >
            {isSubmitting ? 'Compartiendo…' : 'Compartir solo con amigos'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
