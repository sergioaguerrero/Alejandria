/**
 * @file CollaboratorsSection.jsx
 * @description Manages repository collaborators and pending invitations (FE-35, BE-43).
 *
 * Allows repository owners to invite registered students and remove collaborators,
 * invited users to accept or reject invitations, and accepted collaborators to see
 * their contributor status or leave the team.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';

import ConfirmDialog from '../common/ConfirmDialog.jsx';
import {
  getRepositoryCollaborators,
  inviteCollaborator,
  removeCollaborator,
  respondCollaboratorInvitation,
  searchUsers,
} from '../../services/index.js';
import { initials } from '../../utils/users.js';

export default function CollaboratorsSection({
  repository,
  isOwner,
  currentUsername,
  onRepositoryChanged,
  onNotify,
}) {
  const [collaborators, setCollaborators] = useState([]);
  const [studentCandidates, setStudentCandidates] = useState([]);
  const [loadedRepoKey, setLoadedRepoKey] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

  const [inviteValue, setInviteValue] = useState(null);
  const [inviteInput, setInviteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const targetKey = repository?.id ? `${repository.id}:${reloadNonce}` : '';
  const isLoading = Boolean(targetKey && loadedRepoKey !== targetKey);

  useEffect(() => {
    if (!repository?.id) return undefined;
    let active = true;

    const tasks = [getRepositoryCollaborators(repository.id)];
    if (isOwner) {
      tasks.push(searchUsers('').catch(() => []));
    }

    Promise.all(tasks)
      .then(([collabs, users]) => {
        if (!active) return;
        setCollaborators(collabs);
        if (users) {
          setStudentCandidates(users);
        }
      })
      .catch(() => {
        if (!active) return;
        setCollaborators([]);
      })
      .finally(() => {
        if (active) setLoadedRepoKey(targetKey);
      });

    return () => {
      active = false;
    };
  }, [repository?.id, isOwner, targetKey]);

  const refresh = async () => {
    setReloadNonce((n) => n + 1);
    if (onRepositoryChanged) {
      await onRepositoryChanged();
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    const targetUsername =
      typeof inviteValue === 'string'
        ? inviteValue
        : (inviteValue?.username || inviteInput);

    if (!targetUsername.trim()) {
      onNotify?.('Selecciona o escribe el @usuario del estudiante a invitar.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteCollaborator(repository.id, targetUsername);
      setInviteValue(null);
      setInviteInput('');
      onNotify?.('Invitación de colaboración enviada.', 'success');
      await refresh();
    } catch (err) {
      onNotify?.(err?.message || 'No se pudo enviar la invitación.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async (accept) => {
    setIsSubmitting(true);
    try {
      await respondCollaboratorInvitation(repository.id, accept);
      onNotify?.(
        accept
          ? 'Ahora eres colaborador de este repositorio y puedes subir documentos.'
          : 'Has rechazado la invitación a colaborar.',
        accept ? 'success' : 'info',
      );
      await refresh();
    } catch (err) {
      onNotify?.(err?.message || 'No se pudo procesar tu respuesta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (usernameToRemove) => {
    setIsSubmitting(true);
    try {
      await removeCollaborator(repository.id, usernameToRemove);
      setRemoveTarget(null);
      onNotify?.(
        usernameToRemove === currentUsername
          ? 'Has salido del equipo colaborador.'
          : `Se removió a @${usernameToRemove} del equipo colaborador.`,
        'info',
      );
      await refresh();
    } catch (err) {
      onNotify?.(err?.message || 'No se pudo quitar al colaborador.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingUsernames = new Set(collaborators.map((c) => c.username));
  const availableStudents = studentCandidates.filter(
    (u) => !u.isSelf && u.username !== repository.authorUsername && !existingUsernames.has(u.username),
  );
  const acceptedCount = collaborators.filter((c) => c.status === 'aceptado').length;

  return (
    <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1, mb: 2 }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PeopleOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>
              Colaboradores de la ruta de estudio
            </Typography>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`${acceptedCount} activo${acceptedCount === 1 ? '' : 's'}`}
            />
          </Stack>

          {!isOwner && repository.isCollaborator && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              disabled={isSubmitting}
              onClick={() => handleRemove(currentUsername)}
            >
              Salir del equipo
            </Button>
          )}
        </Stack>

        {/* Banner when viewer has a pending invite */}
        {!isOwner && repository.collaboratorStatus === 'pendiente' && (
          <Alert
            severity="info"
            sx={{ mb: 2, borderRadius: 1.5 }}
            action={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlinedIcon />}
                  disabled={isSubmitting}
                  onClick={() => handleRespond(true)}
                >
                  Aceptar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlinedIcon />}
                  disabled={isSubmitting}
                  onClick={() => handleRespond(false)}
                >
                  Rechazar
                </Button>
              </Stack>
            }
          >
            Tienes una invitación pendiente para colaborar en este repositorio. Al aceptar podrás
            subir documentos junto con @{repository.authorUsername}.
          </Alert>
        )}

        {/* Active contributor notice */}
        {!isOwner && repository.isCollaborator && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }}>
            Eres colaborador aceptado en este repositorio: puedes subir tus propios apuntes y guías.
          </Alert>
        )}

        {/* Owner invite form */}
        {isOwner && (
          <Stack
            component="form"
            onSubmit={handleInvite}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ mb: 2.5, alignItems: { sm: 'center' } }}
          >
            <Autocomplete
              freeSolo
              size="small"
              sx={{ flex: 1 }}
              options={availableStudents}
              value={inviteValue}
              inputValue={inviteInput}
              onChange={(_event, newVal) => setInviteValue(newVal)}
              onInputChange={(_event, newInput) => setInviteInput(newInput)}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `@${option.username} (Semestre ${option.semester})`
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invitar colaborador por @usuario"
                  placeholder="Busca o escribe un estudiante..."
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              size="medium"
              startIcon={<GroupAddOutlinedIcon />}
              disabled={isSubmitting || (!inviteValue && !inviteInput.trim())}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Invitar colaborador
            </Button>
          </Stack>
        )}

        {/* Collaborator roster */}
        {isLoading ? (
          <Skeleton variant="rounded" height={56} />
        ) : collaborators.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isOwner
              ? 'Aún no has invitado colaboradores. Arma este repositorio en equipo agregando compañeros.'
              : 'Este repositorio aún no cuenta con colaboradores adicionales.'}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {collaborators.map((collab) => {
              const isPending = collab.status === 'pendiente';
              return (
                <Box
                  key={collab.id || collab.username}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar
                      sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: 'primary.main' }}
                    >
                      {initials({ username: collab.username })}
                    </Avatar>
                    <Box>
                      <Link
                        component={RouterLink}
                        to={`/users/${collab.username}`}
                        variant="subtitle2"
                        fontWeight={600}
                        underline="hover"
                      >
                        @{collab.username}
                      </Link>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Semestre {collab.user?.semester ?? 1}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      size="small"
                      color={isPending ? 'warning' : 'success'}
                      variant="outlined"
                      label={isPending ? 'Pendiente' : 'Colaborador activo'}
                    />
                    {isOwner && (
                      <Tooltip title={isPending ? 'Cancelar invitación' : 'Quitar colaborador'}>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isSubmitting}
                          aria-label={`Quitar a @${collab.username}`}
                          onClick={() => {
                            if (isPending) {
                              handleRemove(collab.username);
                            } else {
                              setRemoveTarget(collab.username);
                            }
                          }}
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Quitar colaborador"
        message={`@${removeTarget} dejará de poder subir documentos nuevos a "${repository.name}". Sus documentos ya publicados se conservarán.`}
        confirmLabel="Quitar colaborador"
        confirmColor="error"
        isBusy={isSubmitting}
        onConfirm={() => handleRemove(removeTarget)}
        onClose={() => !isSubmitting && setRemoveTarget(null)}
      />
    </Card>
  );
}
