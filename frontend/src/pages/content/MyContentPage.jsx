/**
 * @file MyContentPage.jsx
 * @description View 12 — My repositories and documents (FE-14, RF-27, RF-28).
 *
 * Lists the repositories and the documents of the session user in two tabs with
 * tables. Each row can be opened, edited or deleted after a confirmation.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Divider,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/authContext.js';
import { MATERIAL_TYPES } from '../../mocks/catalogs.js';
import {
  deleteDocument,
  deleteRepository,
  getDocumentsByUser,
  getMyCollaborations,
  removeCollaborator,
  respondCollaboratorInvitation,
  getRepositoriesByUser,
} from '../../services/index.js';

/** Label of a material type. */
function materialTypeLabel(type) {
  return MATERIAL_TYPES.find((materialType) => materialType.value === type)?.label ?? type;
}

export default function MyContentPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('repositories'); // 'repositories' | 'documents'
  const [repositories, setRepositories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [collaborations, setCollaborations] = useState({
    invitations: [],
    collaboratedRepositories: [],
  });
  const [isCollabBusy, setIsCollabBusy] = useState(false);

  const reloadCollaborations = async () => {
    const fresh = await getMyCollaborations();
    setCollaborations(fresh);
  };

  const handleRespondInvitation = async (repositoryId, accept) => {
    setIsCollabBusy(true);
    setError('');
    try {
      await respondCollaboratorInvitation(repositoryId, accept);
      await reloadCollaborations();
      setNotice(
        accept
          ? 'Invitación aceptada. Ya puedes subir documentos en ese repositorio.'
          : 'Invitación rechazada.',
      );
    } catch (err) {
      setError(err?.message || 'No se pudo responder la invitación.');
    } finally {
      setIsCollabBusy(false);
    }
  };

  const handleLeaveCollaboration = async (repositoryId) => {
    if (!user?.username) return;
    setIsCollabBusy(true);
    setError('');
    try {
      await removeCollaborator(repositoryId, user.username);
      await reloadCollaborations();
      setNotice('Has salido del equipo colaborador.');
    } catch (err) {
      setError(err?.message || 'No se pudo salir del repositorio.');
    } finally {
      setIsCollabBusy(false);
    }
  };
  const [loadedUsername, setLoadedUsername] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'repository'|'document', item }
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoading = !user || loadedUsername !== user.username;

  // Loads both lists. The flags are only touched from the asynchronous
  // callbacks, so the effect never triggers a synchronous render.
  useEffect(() => {
    if (!user) return undefined;

    let active = true;

    Promise.all([getRepositoriesByUser(user.username), getDocumentsByUser(user.username), getMyCollaborations()])
      .then(([loadedRepositories, loadedDocuments, loadedCollaborations]) => {
        if (!active) return;
        setRepositories(loadedRepositories);
        setCollaborations(loadedCollaborations);
        setDocuments(loadedDocuments);
      })
      .catch((serviceError) => {
        if (active) setError(serviceError?.message ?? 'No se pudo cargar tu contenido.');
      })
      .finally(() => {
        if (active) setLoadedUsername(user.username);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'repository') {
        await deleteRepository(deleteTarget.item.id);
        setRepositories((list) => list.filter((item) => item.id !== deleteTarget.item.id));
        // The service removes the documents of the repository too.
        setDocuments((list) =>
          list.filter((document) => document.repositoryId !== deleteTarget.item.id),
        );
        setNotice('Repositorio eliminado.');
      } else {
        await deleteDocument(deleteTarget.item.id);
        setDocuments((list) => list.filter((item) => item.id !== deleteTarget.item.id));
        setNotice('Documento eliminado.');
      }
      setDeleteTarget(null);
    } catch (serviceError) {
      setError(serviceError?.message ?? 'No se pudo eliminar el contenido.');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Mis repositorios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra tus repositorios de estudio y los documentos que has compartido.
          </Typography>
        </Stack>

        <Button
          component={RouterLink}
          to="/repositories/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Crear repositorio
        </Button>
      </Stack>

      <Tabs value={activeTab} onChange={(event, value) => setActiveTab(value)} sx={{ mb: 3 }}>
        <Tab
          value="repositories"
          icon={<FolderOpenIcon />}
          iconPosition="start"
          label={`Repositorios (${repositories.length})`}
        />
        <Tab
          value="documents"
          icon={<DescriptionOutlinedIcon />}
          iconPosition="start"
          label={`Documentos (${documents.length})`}
        />
        <Tab
          value="collaborations"
          icon={<PeopleOutlinedIcon />}
          iconPosition="start"
          label={`Colaboraciones (${collaborations.collaboratedRepositories.length}${
            collaborations.invitations.length > 0
              ? ` • ${collaborations.invitations.length} pendiente${
                  collaborations.invitations.length > 1 ? 's' : ''
                }`
              : ''
          })`}
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Skeleton variant="rounded" height={320} />
      ) : activeTab === 'repositories' ? (
        repositories.length === 0 ? (
          <EmptyState
            icon={FolderOpenIcon}
            title="Aún no tienes repositorios creados"
            description="Crea tu primer repositorio para organizar tus apuntes y material de estudio."
            action={
              <Button
                component={RouterLink}
                to="/repositories/new"
                variant="contained"
                startIcon={<AddIcon />}
              >
                Crear repositorio
              </Button>
            }
          />
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Materia</TableCell>
                  <TableCell align="center">Documentos</TableCell>
                  <TableCell align="center">Me gusta</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repositories.map((repository) => (
                  <TableRow key={repository.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{repository.name}</TableCell>
                    <TableCell>{repository.subject?.name ?? 'Sin materia'}</TableCell>
                    <TableCell align="center">{repository.documentCount ?? 0}</TableCell>
                    <TableCell align="center">{repository.likes ?? 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver repositorio">
                        <IconButton
                          size="small"
                          color="primary"
                          component={RouterLink}
                          to={`/repositories/${repository.id}`}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar repositorio">
                        <IconButton
                          size="small"
                          color="info"
                          component={RouterLink}
                          to={`/repositories/${repository.id}/edit`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar repositorio">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget({ type: 'repository', item: repository })}
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : activeTab === 'collaborations' ? (
        collaborations.invitations.length === 0 &&
        collaborations.collaboratedRepositories.length === 0 ? (
          <EmptyState
            icon={PeopleOutlinedIcon}
            title="Aún no colaboras en otros repositorios"
            description="Cuando otro estudiante te invite a colaborar en su repositorio, podrás aceptar la invitación aquí y subir documentos juntos."
          />
        ) : (
          <Stack spacing={3}>
            {collaborations.invitations.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Invitaciones pendientes ({collaborations.invitations.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {collaborations.invitations.map((invite) => (
                    <Stack
                      key={invite.id}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        justifyContent: 'space-between',
                        alignItems: { sm: 'center' },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {invite.repository?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invite.repository?.subject?.name ?? 'Materia'} • Invitado por @
                          {invite.invitedBy}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleOutlinedIcon />}
                          disabled={isCollabBusy}
                          onClick={() => handleRespondInvitation(invite.repositoryId, true)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelOutlinedIcon />}
                          disabled={isCollabBusy}
                          onClick={() => handleRespondInvitation(invite.repositoryId, false)}
                        >
                          Rechazar
                        </Button>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}

            {collaborations.collaboratedRepositories.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Repositorio compartido</TableCell>
                      <TableCell>Dueño</TableCell>
                      <TableCell>Materia</TableCell>
                      <TableCell align="center">Documentos</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collaborations.collaboratedRepositories.map((repo) => (
                      <TableRow key={repo.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{repo.name}</TableCell>
                        <TableCell>@{repo.authorUsername}</TableCell>
                        <TableCell>{repo.subject?.name ?? 'Sin materia'}</TableCell>
                        <TableCell align="center">{repo.documentCount ?? 0}</TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: 'flex-end', alignItems: 'center' }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              to={`/repositories/${repo.id}/upload`}
                              startIcon={<AddIcon />}
                            >
                              Subir doc
                            </Button>
                            <Tooltip title="Ver repositorio">
                              <IconButton
                                size="small"
                                color="primary"
                                component={RouterLink}
                                to={`/repositories/${repo.id}`}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              color="error"
                              disabled={isCollabBusy}
                              onClick={() => handleLeaveCollaboration(repo.id)}
                            >
                              Salir
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )
      ) : documents.length === 0 ? (
        <EmptyState
          icon={DescriptionOutlinedIcon}
          title="Aún no has subido documentos"
          description="Entra a uno de tus repositorios y sube tus primeros apuntes o resúmenes."
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Corte</TableCell>
                <TableCell>Tema</TableCell>
                <TableCell align="center">Interacciones</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{document.title}</TableCell>
                  <TableCell>
                    <Chip label={materialTypeLabel(document.type)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{`Corte ${document.term}`}</TableCell>
                  <TableCell>{document.topic}</TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      {`${document.views || 0} vistas · ${document.downloads || 0} descargas`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver documento">
                      <IconButton
                        size="small"
                        color="primary"
                        component={RouterLink}
                        to={`/documents/${document.id}`}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar documento">
                      <IconButton
                        size="small"
                        color="info"
                        component={RouterLink}
                        to={`/documents/${document.id}/edit`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar documento">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget({ type: 'document', item: document })}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'repository' ? 'Eliminar repositorio' : 'Eliminar documento'}
        message={`¿Estás seguro de eliminar "${
          deleteTarget?.item?.title || deleteTarget?.item?.name
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isBusy={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        message={notice}
      />
    </Box>
  );
}
