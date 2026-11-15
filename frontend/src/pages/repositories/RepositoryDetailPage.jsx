/**
 * @file RepositoryDetailPage.jsx
 * @description View 7 — Repository detail (FE-12, endpoints BE-12, BE-13 and BE-20).
 *
 * Header with the repository data, the like button and the owner actions, and a
 * tab per term with the documents of each one. It shows skeletons while loading,
 * an empty state per tab and an Alert when the repository does not exist.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import CollaboratorsSection from '../../components/repositories/CollaboratorsSection.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ReportDialog from '../../components/common/ReportDialog.jsx';
import DocumentItem from '../../components/documents/DocumentItem.jsx';
import { useAuth } from '../../context/authContext.js';
import { TERMS } from '../../mocks/catalogs.js';
import {
  deleteRepository,
  getRepository,
  listByRepository,
  toggleRepositoryLike,
  toggleFollowRepository,
} from '../../services/index.js';

export default function RepositoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repository, setRepository] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(1);
  const [isLiking, setIsLiking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deleted, setDeleted] = useState(false);

  // Loads the repository and its documents together. The loading flag starts as
  // true and the state is only touched from the asynchronous callbacks.
  useEffect(() => {
    let active = true;

    Promise.all([getRepository(id), listByRepository(id)])
      .then(([loadedRepository, loadedDocuments]) => {
        if (!active) return;
        setRepository(loadedRepository);
        setDocuments(loadedDocuments);
        // Opens the first term that actually has documents.
        const firstWithDocuments = TERMS.find(({ value }) =>
          loadedDocuments.some((document) => document.term === value),
        );
        setTab(firstWithDocuments?.value ?? 1);
      })
      .catch((serviceError) => {
        if (active) setError(serviceError?.message ?? 'No se pudo cargar el repositorio.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const documentsByTerm = useMemo(() => {
    const map = new Map(TERMS.map(({ value }) => [value, []]));

    for (const document of documents) {
      map.get(document.term)?.push(document);
    }

    return map;
  }, [documents]);

  const isOwner = Boolean(repository && user?.username === repository.authorUsername);
  const canUpload = Boolean(isOwner || repository?.canUpload || repository?.isCollaborator);

  const handleRefreshRepository = async () => {
    try {
      const fresh = await getRepository(repository.id);
      setRepository(fresh);
    } catch {
      // Keep current repository state if silent reload fails
    }
  };

  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    setIsFollowing(true);
    try {
      const result = await toggleFollowRepository(repository.id);
      setRepository((current) => ({
        ...current,
        followed: result.followed,
        followersCount:
          result.followersCount ??
          (current.followersCount != null
            ? Math.max(0, current.followersCount + (result.followed ? 1 : -1))
            : current.followersCount),
      }));
      setNotice({
        severity: 'success',
        message: result.followed
          ? 'Ahora sigues este repositorio. Recibirás avisos de nuevos contenidos y podrás estudiarlo con IA.'
          : 'Has dejado de seguir este repositorio.',
      });
    } catch (serviceError) {
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo actualizar el seguimiento.',
      });
    } finally {
      setIsFollowing(false);
    }
  };

  const handleLike = async () => {
    setIsLiking(true);

    try {
      const result = await toggleRepositoryLike(repository.id);
      setRepository((current) => ({ ...current, liked: result.liked, likes: result.likes }));
    } catch (serviceError) {
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo actualizar tu reacción.',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteRepository(repository.id);
      setConfirmOpen(false);
      setDeleted(true);
      setNotice({ severity: 'success', message: 'El repositorio se eliminó.' });
    } catch (serviceError) {
      setConfirmOpen(false);
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo eliminar el repositorio.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNoticeClose = () => {
    setNotice(null);
    if (deleted) navigate('/', { replace: true });
  };

  const handleReported = () => {
    setReportOpen(false);
    setNotice({
      severity: 'success',
      message: 'Gracias por tu reporte. El equipo de administración lo revisará.',
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={220} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 3 }} />
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={104} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          component={RouterLink}
          to="/"
          variant="text"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, px: 0 }}
        >
          Volver a explorar
        </Button>

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/">
              Ir al inicio
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!repository) return null;

  const subject = repository.subject;
  const currentDocuments = documentsByTerm.get(tab) ?? [];

  return (
    <Box>
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        Volver a explorar
      </Button>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={subject?.name ?? 'Sin materia'}
                color="primary"
                variant="outlined"
                size="small"
              />
              {subject?.semester && (
                <Typography variant="caption" color="text.secondary">
                  {`Semestre ${subject.semester}`}
                </Typography>
              )}
            </Stack>

            <Typography variant="h3" component="h1">
              {repository.name}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {repository.description}
            </Typography>

            <Divider />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
            >
              <Link
                component={RouterLink}
                to={`/users/${repository.authorUsername}`}
                variant="body2"
              >
                {`@${repository.authorUsername}`}
              </Link>

              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant={repository.liked ? 'contained' : 'outlined'}
                  onClick={handleLike}
                  disabled={isLiking}
                  startIcon={repository.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  aria-label={repository.liked ? 'Quitar corazón' : 'Dar corazón'}
                >
                  {repository.likes}
                </Button>

                {!isOwner && (
                  <Button
                    variant={repository.followed ? 'contained' : 'outlined'}
                    color={repository.followed ? 'primary' : 'inherit'}
                    onClick={handleFollow}
                    disabled={isFollowing}
                    startIcon={repository.followed ? <BookmarkAddedIcon /> : <BookmarkAddOutlinedIcon />}
                  >
                    {repository.followed ? 'Siguiendo' : 'Seguir repositorio'}
                  </Button>
                )}

                <Button
                  component={RouterLink}
                  to={`/ai?repositoryId=${repository.id}`}
                  variant="outlined"
                  color="primary"
                  startIcon={<AutoAwesomeIcon />}
                >
                  Estudiar con IA
                </Button>

                {!isOwner && (
                  <Button
                    variant="outlined"
                    startIcon={<FlagOutlinedIcon />}
                    onClick={() => setReportOpen(true)}
                  >
                    Reportar
                  </Button>
                )}
              </Stack>
            </Stack>

            {!isOwner && canUpload && (
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                <Button
                  component={RouterLink}
                  to={`/repositories/${repository.id}/upload`}
                  startIcon={<AddIcon />}
                >
                  Subir documento
                </Button>
              </Stack>
            )}

            {/* Owner actions live on their own row so they never wrap out of place. */}
            {isOwner && (
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
              >
                <Button
                  component={RouterLink}
                  to={`/repositories/${repository.id}/upload`}
                  startIcon={<AddIcon />}
                >
                  Subir documento
                </Button>

                <Button
                  component={RouterLink}
                  to={`/repositories/${repository.id}/edit`}
                  variant="outlined"
                  startIcon={<EditOutlinedIcon />}
                >
                  Editar
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<DeleteOutlinedIcon />}
                  onClick={() => setConfirmOpen(true)}
                  sx={{
                    color: 'error.main',
                    borderColor: 'error.main',
                    '&:hover': {
                      borderColor: 'error.main',
                      backgroundColor: 'rgba(248, 113, 113, 0.08)',
                    },
                  }}
                >
                  Eliminar
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* ── Documents by term ──────────────────────────────────────────── */}
          <Tabs
            value={tab}
            onChange={(event, value) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ mb: 3 }}
          >
            {TERMS.map(({ value, label }) => (
              <Tab
                key={value}
                value={value}
                label={`${label} (${documentsByTerm.get(value)?.length ?? 0})`}
              />
            ))}
          </Tabs>

          {currentDocuments.length === 0 ? (
            <EmptyState
              icon={FolderOpenIcon}
              title="Todavía no hay documentos en este corte"
              description={
                isOwner
                  ? 'Sube el material que quieras compartir con tus compañeros.'
                  : 'Cuando el autor suba material de este corte aparecerá aquí.'
              }
              action={
                canUpload ? (
                  <Button
                    component={RouterLink}
                    to={`/repositories/${repository.id}/upload`}
                    startIcon={<AddIcon />}
                  >
                    Subir documento
                  </Button>
                ) : null
              }
            />
          ) : (
            <Stack spacing={2}>
              {currentDocuments.map((document) => (
                <DocumentItem key={document.id} document={document} />
              ))}
            </Stack>
          )}
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <CollaboratorsSection
            repository={repository}
            isOwner={isOwner}
            currentUsername={user?.username}
            onRepositoryChanged={handleRefreshRepository}
            onNotify={(message, severity = 'info') => setNotice({ message, severity })}
          />
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar repositorio"
        message={`Se eliminarán "${repository.name}" y todos sus documentos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />

      <ReportDialog
        open={reportOpen}
        targetType="repository"
        targetId={repository.id}
        targetLabel={repository.name}
        onClose={() => setReportOpen(false)}
        onReported={handleReported}
      />

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={handleNoticeClose}>
        <Alert severity={notice?.severity ?? 'info'} variant="filled" onClose={handleNoticeClose}>
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
