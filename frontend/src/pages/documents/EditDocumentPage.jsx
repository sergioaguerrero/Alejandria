/**
 * @file EditDocumentPage.jsx
 * @description View 13 — Edit document (FE-14, endpoint BE-17).
 *
 * Reuses the form of the upload view (DocumentForm) with the saved data. The
 * file is optional: the author can keep the current one or replace it with the
 * same rules of view 9. Only the author can enter; the rest go to the error
 * page (view 26).
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
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import DocumentForm from '../../components/forms/DocumentForm.jsx';
import { useAuth } from '../../context/authContext.js';
import { getDocument, listSubjectTopics, updateDocument } from '../../services/index.js';

export default function EditDocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documentData, setDocumentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(/** @type {number|null} */ (null));
  const [topicSuggestions, setTopicSuggestions] = useState(/** @type {string[]} */ ([]));

  // Loads the document. The loading flag starts as true and the state is only
  // touched from the asynchronous callbacks.
  useEffect(() => {
    let active = true;

    getDocument(id)
      .then((loadedDocument) => {
        if (!active) return;
        setDocumentData(loadedDocument);
        const subjectId = loadedDocument?.subject?.id ?? loadedDocument?.repository?.subjectId;
        listSubjectTopics(subjectId)
          .then((topics) => {
            if (active) setTopicSuggestions(topics);
          })
          .catch(() => {});
      })
      .catch((serviceError) => {
        if (active) setError(serviceError?.message ?? 'No se pudo cargar el documento.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const isAuthor = Boolean(documentData && user?.username === documentData.authorUsername);

  // Only the author can edit; the rest go to the error page. The check runs
  // once the document is loaded.
  useEffect(() => {
    if (documentData && !isAuthor) navigate('/403', { replace: true });
  }, [documentData, isAuthor, navigate]);

  /**
   * Saves the changes and goes back to the detail. The errors stay in the
   * form, which already shows them.
   * @param {object} data  Values and the optional new file coming from DocumentForm.
   */
  const handleSubmit = async (data) => {
    setProgress(0);

    try {
      await updateDocument(
        id,
        {
          ...data,
          subjectId: documentData?.subject?.id ?? documentData?.repository?.subjectId,
        },
        setProgress,
      );
      setProgress(null);
      navigate(`/documents/${id}`);
    } catch (submitError) {
      setProgress(null);
      throw submitError;
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={72} width={260} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={520} />
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
          Volver al inicio
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
  if (!documentData || !isAuthor) return null;

  const subject = documentData.subject;
  const repository = documentData.repository;

  return (
    <Box>
      <Button
        component={RouterLink}
        to={`/documents/${documentData.id}`}
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        Volver al documento
      </Button>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Editar documento
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={subject?.name ?? 'Sin materia'}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {`En "${repository?.name ?? 'tu repositorio'}"`}
          </Typography>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <DocumentForm
            subjectId={subject?.id ?? repository?.subjectId}
            topicSuggestions={topicSuggestions}
            initialValues={{
              title: documentData.title,
              description: documentData.description,
              type: documentData.type,
              term: documentData.term,
              topic: documentData.topic,
              tags: documentData.tags ?? [],
            }}
            currentFile={documentData.file}
            requireFile={false}
            submitLabel="Guardar cambios"
            submitIcon={<SaveOutlinedIcon />}
            progress={progress}
            progressLabel="Guardando…"
            busyLabel="Guardando…"
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/documents/${documentData.id}`)}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
