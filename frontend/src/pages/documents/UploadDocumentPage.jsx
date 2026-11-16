/**
 * @file UploadDocumentPage.jsx
 * @description View 9 — Upload document (FE-15, FE-36, endpoint BE-15).
 *
 * Only the owner of the repository can upload. The page loads the repository,
 * checks the ownership and, when the visitor is not the owner, sends them to
 * the error page (view 26). The form, the file check and the progress bar live
 * in DocumentForm; this page only loads the data and talks to the service.
 */

import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import DocumentForm from '../../components/forms/DocumentForm.jsx';
import { useAuth } from '../../context/authContext.js';
import { getRepository, listSubjectTopics, uploadDocument } from '../../services/index.js';

export default function UploadDocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(/** @type {number|null} */ (null));
  const [topicSuggestions, setTopicSuggestions] = useState(/** @type {string[]} */ ([]));

  // Loads the repository. The loading flag starts as true and the state is only
  // touched from the asynchronous callbacks.
  useEffect(() => {
    let active = true;

    getRepository(id)
      .then((loadedRepository) => {
        if (!active) return;
        setRepository(loadedRepository);
        const subjectId = loadedRepository?.subject?.id ?? loadedRepository?.subjectId;
        listSubjectTopics(subjectId)
          .then((topics) => {
            if (active) setTopicSuggestions(topics);
          })
          .catch(() => {});
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

  const isOwner = Boolean(
    repository &&
      (user?.username === repository.authorUsername ||
        repository.canUpload ||
        repository.isCollaborator),
  );

  // Only the owner can upload; the rest go to the error page. The check runs
  // once the repository is loaded.
  useEffect(() => {
    if (repository && !isOwner) navigate('/403', { replace: true });
  }, [repository, isOwner, navigate]);

  /**
   * Sends the document to the service and goes to its detail on success.
   * The errors stay in the form, which already shows them.
   * @param {object} data  Values and file coming from DocumentForm.
   */
  const handleSubmit = async (data) => {
    setProgress(0);

    try {
      const document = await uploadDocument(
        { ...data, repositoryId: id, subjectId: repository?.subject?.id ?? repository?.subjectId },
        setProgress,
      );
      setProgress(null);
      // TODO(FE-16): the document detail (view 10) lands in Sprint 1.
      navigate(`/documents/${document.id}`);
    } catch (submitError) {
      setProgress(null);
      throw submitError;
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={72} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={520} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          component={RouterLink}
          to={`/repositories/${id}`}
          variant="text"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, px: 0 }}
        >
          Volver al repositorio
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

  // While the redirect to the error page happens, nothing is rendered.
  if (!repository || !isOwner) return null;

  const subject = repository.subject;

  return (
    <Box>
      <Button
        component={RouterLink}
        to={`/repositories/${repository.id}`}
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        Volver al repositorio
      </Button>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Subir documento
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={subject?.name ?? 'Sin materia'}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {`Se publicará en "${repository.name}"`}
          </Typography>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <DocumentForm
            subjectId={subject?.id ?? repository.subjectId}
            topicSuggestions={topicSuggestions}
            progress={progress}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
