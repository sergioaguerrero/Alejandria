/**
 * @file DocumentPreview.jsx
 * @description File viewer of the document detail (view 10, FE-16).
 *
 * PDF files open inside the page with an iframe and images with an <img>.
 * Word, PowerPoint and Excel have no preview in the browser, so a card with
 * the type icon and only the download button is shown instead.
 */

import { Box, Button, Card, Stack, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { fileTypeInfo, isPreviewable } from '../../utils/fileTypes.js';

/** Height of the viewer on desktop. */
const VIEWER_HEIGHT = { xs: 420, md: 640 };

/**
 * @param {object} props
 * @param {object} props.document  Document enriched by the service.
 * @param {() => void} props.onDownload
 * @param {boolean} [props.isDownloading]
 */
export default function DocumentPreview({ document, onDownload, isDownloading = false }) {
  const file = document.file ?? {};
  const extension = String(file.extension ?? '').toLowerCase();
  const { label, Icon } = fileTypeInfo(extension);
  const fileName = file.name ?? document.title;

  if (extension === 'pdf') {
    return (
      <Box
        component="iframe"
        src={file.url}
        title={fileName}
        sx={{
          width: '100%',
          height: VIEWER_HEIGHT,
          border: 0,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      />
    );
  }

  if (isPreviewable(extension)) {
    return (
      <Box
        component="img"
        src={file.url}
        alt={fileName}
        sx={{
          width: '100%',
          maxHeight: VIEWER_HEIGHT,
          objectFit: 'contain',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      />
    );
  }

  return (
    <Card>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', px: 3, py: 6 }}>
        <Icon sx={{ fontSize: 64, color: 'primary.main' }} />

        <Typography variant="h6" component="p" sx={{ wordBreak: 'break-word' }}>
          {fileName}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {`Los archivos ${label} no se pueden previsualizar en el navegador.`}
        </Typography>

        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? 'Descargando…' : 'Descargar'}
        </Button>
      </Stack>
    </Card>
  );
}
