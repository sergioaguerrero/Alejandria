/**
 * @file DocumentDetailPage.jsx
 * @description View 10 — Document detail (FE-16, endpoints BE-16, BE-13 and BE-21).
 *
 * Shows the file in a viewer (or a card when it cannot be previewed), the
 * metadata, and the download, like and report actions. The author also sees
 * the edit and delete actions. It is open to students and admins.
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
  Divider,
  Link,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import ReportDialog from '../../components/common/ReportDialog.jsx';
import DocumentPreview from '../../components/documents/DocumentPreview.jsx';
import { useAuth } from '../../context/authContext.js';
import { MATERIAL_TYPES, TERMS } from '../../mocks/catalogs.js';
import { isPreviewable } from '../../utils/fileTypes.js';
import {
  deleteDocument,
  downloadDocument,
  getDocument,
  toggleDocumentLike,
} from '../../services/index.js';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documentData, setDocumentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deleted, setDeleted] = useState(false);

  // Loads the document. The loading flag starts as true and the state is only
  // touched from the asynchronous callbacks.
  useEffect(() => {
    let active = true;

    getDocument(id)
      .then((loadedDocument) => {
        if (active) setDocumentData(loadedDocument);
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

  const handleLike = async () => {
    setIsLiking(true);

    try {
      const result = await toggleDocumentLike(documentData.id);
      setDocumentData((current) => ({ ...current, liked: result.liked, likes: result.likes }));
    } catch (serviceError) {
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo actualizar el me gusta.',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const { url, name } = await downloadDocument(documentData.id);

      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // The service already registered the download; the counter is refreshed
      // so the screen does not stay behind.
      setDocumentData((current) => ({ ...current, downloads: (current.downloads ?? 0) + 1 }));
    } catch (serviceError) {
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo descargar el archivo.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteDocument(documentData.id);
      setConfirmOpen(false);
      setDeleted(true);
      setNotice({ severity: 'success', message: 'El documento se eliminó.' });
    } catch (serviceError) {
      setConfirmOpen(false);
      setNotice({
        severity: 'error',
        message: serviceError?.message ?? 'No se pudo eliminar el documento.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNoticeClose = () => {
    setNotice(null);
    if (deleted) {
      navigate(`/repositories/${documentData.repositoryId}`, { replace: true });
    }
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
        <Skeleton variant="rounded" height={40} width={220} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
          }}
        >
          <Skeleton variant="rounded" height={560} />
          <Skeleton variant="rounded" height={400} />
        </Box>
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

  if (!documentData) return null;

  const subject = documentData.subject;
  const repository = documentData.repository;
  const typeLabel =
    MATERIAL_TYPES.find((item) => item.value === documentData.type)?.label ?? documentData.type;
  const termLabel =
    TERMS.find((item) => item.value === documentData.term)?.label ?? `Corte ${documentData.term}`;
  // When the file cannot be previewed, the download button lives in the card
  // that replaces the viewer, so it is not repeated here.
  const canPreview = isPreviewable(documentData.file?.extension);

  return (
    <Box>
      <Button
        component={RouterLink}
        to={`/repositories/${documentData.repositoryId}`}
        variant="text"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        Volver al repositorio
      </Button>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={subject?.name ?? 'Sin materia'} color="primary" variant="outlined" size="small" />
          <Chip label={typeLabel} size="small" />
          <Chip label={termLabel} size="small" variant="outlined" />
          {subject?.semester && (
            <Typography variant="caption" color="text.secondary">
              {`Semestre ${subject.semester}`}
            </Typography>
          )}
        </Stack>

        <Typography variant="h3" component="h1">
          {documentData.title}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {documentData.description}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <VisibilityOutlinedIcon fontSize="small" />
            <Typography variant="body2">{`${documentData.views ?? 0} vistas`}</Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <DownloadIcon fontSize="small" />
            <Typography variant="body2">{`${documentData.downloads ?? 0} descargas`}</Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* ── Viewer + metadata ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 2fr) minmax(280px, 1fr)',
          },
        }}
      >
        <DocumentPreview
          document={documentData}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />

        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" component="h2">
                  Detalles
                </Typography>

                <DetailRow label="Tipo">{typeLabel}</DetailRow>
                <DetailRow label="Corte">{termLabel}</DetailRow>
                <DetailRow label="Tema">{documentData.topic}</DetailRow>

                <DetailRow label="Materia">
                  {subject?.name ?? 'Sin materia'}
                </DetailRow>

                <DetailRow label="Repositorio">
                  <Link component={RouterLink} to={`/repositories/${documentData.repositoryId}`}>
                    {repository?.name ?? 'Ver repositorio'}
                  </Link>
                </DetailRow>

                <DetailRow label="Autor">
                  {/* TODO(FE-13): the public profile (view 16) lands in Sprint 3. */}
                  <Link component={RouterLink} to={`/users/${documentData.authorUsername}`}>
                    {`@${documentData.authorUsername}`}
                  </Link>
                </DetailRow>

                {documentData.tags?.length > 0 && (
                  <>
                    <Divider />
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Etiquetas
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                        {documentData.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={1.5}>
            {canPreview && (
              <Button
                variant="contained"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? 'Descargando…' : 'Descargar'}
              </Button>
            )}

            <Button
              variant={documentData.liked ? 'contained' : 'outlined'}
              onClick={handleLike}
              disabled={isLiking}
              startIcon={documentData.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              aria-label="Me gusta"
            >
              {`Me gusta (${documentData.likes ?? 0})`}
            </Button>

            {!isAuthor && (
              <Button
                variant="outlined"
                startIcon={<FlagOutlinedIcon />}
                onClick={() => setReportOpen(true)}
                fullWidth
              >
                Reportar
              </Button>
            )}

            {isAuthor && (
              <>
                <Divider sx={{ my: 0.5 }} />

                <Button
                  component={RouterLink}
                  to={`/documents/${documentData.id}/edit`}
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
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar documento"
        message={`Se eliminará "${documentData.title}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />

      <ReportDialog
        open={reportOpen}
        targetType="document"
        targetId={documentData.id}
        targetLabel={documentData.title}
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

/**
 * Label and value row of the metadata card.
 * @param {{ label: string, children: import('react').ReactNode }} props
 */
function DetailRow({ label, children }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>

      <Box sx={{ minWidth: 0, textAlign: 'right' }}>
        <Typography variant="body2" component="div">
          {children}
        </Typography>
      </Box>
    </Stack>
  );
}
