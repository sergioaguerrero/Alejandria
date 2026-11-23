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
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        position: { lg: 'sticky' },
        top: { lg: 84 },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          useFlexGap
          spacing={1}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PeopleOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight={700}>
              Colaboradores
            </Typography>
          </Stack>
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
            fullWidth
            disabled={isSubmitting}
            onClick={() => handleRemove(currentUsername)}
            sx={{ mb: 2 }}
          >
            Salir del equipo
          </Button>
        )}

        {/* Banner when viewer has a pending invite */}
        {!isOwner && repository.collaboratorStatus === 'pendiente' && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
            <Typography variant="body2">
              Tienes una invitación pendiente para colaborar con @{repository.authorUsername}.
            </Typography>
            <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
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
          </Alert>
        )}

        {/* Owner invite form */}
        {isOwner && (
          <Stack
            component="form"
            onSubmit={handleInvite}
            direction="column"
            spacing={1.25}
            sx={{ mb: 2.5 }}
          >
            <Autocomplete
              freeSolo
              size="small"
              fullWidth
              options={availableStudents}
              value={inviteValue}
              inputValue={inviteInput}
              onChange={(_event, newVal) => setInviteValue(newVal)}
              onInputChange={(_event, newInput) => setInviteInput(newInput)}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `@${option.username}`
              }
              isOptionEqualToValue={(option, value) =>
                typeof value === 'object' && value !== null && option.id === value.id
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...optionProps}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}
                  >
                    <Avatar
                      src={option.avatarUrl || option.photoUrl || undefined}
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        flexShrink: 0,
                      }}
                    >
                      {initials({ username: option.username })}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      @{option.username}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invitar por @usuario"
                  placeholder="Busca o escribe un estudiante..."
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps?.input,
                      startAdornment: (
                        <>
                          {inviteValue &&
                            typeof inviteValue === 'object' &&
                            inviteInput === `@${inviteValue.username}` && (
                              <Avatar
                                src={inviteValue.avatarUrl || inviteValue.photoUrl || undefined}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                  ml: 0.25,
                                  mr: 0.5,
                                  flexShrink: 0,
                                }}
                              >
                                {initials({ username: inviteValue.username })}
                              </Avatar>
                            )}
                          {params.slotProps?.input?.startAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              fullWidth
              startIcon={<GroupAddOutlinedIcon />}
              disabled={isSubmitting || (!inviteValue && !inviteInput.trim())}
            >
              Invitar colaborador
            </Button>
          </Stack>
        )}

        {/* Collaborator roster */}
        {isLoading ? (
          <Skeleton variant="rounded" height={64} />
        ) : collaborators.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isOwner
              ? 'Aún no has invitado colaboradores. Arma este repositorio en equipo agregando compañeros.'
              : 'Este repositorio aún no cuenta con colaboradores adicionales.'}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
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
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        flexShrink: 0,
                      }}
                    >
                      {initials({ username: collab.username })}
                    </Avatar>
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Link
                        component={RouterLink}
                        to={`/users/${collab.username}`}
                        variant="subtitle2"
                        fontWeight={600}
                        underline="hover"
                        noWrap
                        sx={{ display: 'block' }}
                      >
                        @{collab.username}
                      </Link>
                      <Stack direction="row" useFlexGap spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          Semestre {collab.user?.semester ?? 1}
                        </Typography>
                        <Chip
                          size="small"
                          color={isPending ? 'warning' : 'success'}
                          variant="outlined"
                          label={isPending ? 'Pendiente' : 'Activo'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Stack>
                    </Stack>
                  </Stack>

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
                </Box>
              );
            })}
          </Stack>
        )}

        {/* Active contributor notice */}
        {!isOwner && repository.isCollaborator && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 1.5 }}>
            Eres colaborador aceptado: puedes subir documentos a este repositorio.
          </Alert>
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
