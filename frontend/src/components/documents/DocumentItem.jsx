/**
 * @file DocumentItem.jsx
 * @description Document row of the listings (view 7; reused in views 11 and 12).
 *
 * Shows the title, the material type, the topic and the tag chips. Clicking it
 * opens the document detail (view 10), and optional download triggers directly.
 */

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Link as RouterLink } from 'react-router-dom';

import { MATERIAL_TYPES } from '../../mocks/catalogs.js';
import { fileTypeInfo } from '../../utils/fileTypes.js';

/** Type value → label in Spanish. */
const TYPE_LABELS = Object.fromEntries(MATERIAL_TYPES.map(({ value, label }) => [value, label]));

/**
 * @param {object} props
 * @param {object} props.document  Document enriched by the service.
 * @param {(document: object) => void} [props.onDownload]
 * @param {boolean} [props.isDownloading]
 */
export default function DocumentItem({ document, onDownload, isDownloading = false }) {
  const { Icon } = fileTypeInfo(document.file?.extension);
  const typeLabel = TYPE_LABELS[document.type] ?? document.type;

  return (
    <Card>
      <Stack direction="row" sx={{ alignItems: 'stretch' }}>
        <CardActionArea
          component={RouterLink}
          to={`/documents/${document.id}`}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ color: 'primary.main', lineHeight: 0, pt: 0.5 }}>
                <Icon />
              </Box>

              <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  {document.title}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip label={typeLabel} size="small" color="primary" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    {`Tema: ${document.topic}`}
                  </Typography>
                </Stack>

                {document.tags?.length > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                    {document.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>

        {onDownload && (
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5, pl: 0.5 }}>
            <Tooltip title="Descargar documento">
              <span>
                <IconButton
                  color="primary"
                  aria-label={`Descargar ${document.title}`}
                  disabled={isDownloading}
                  onClick={() => onDownload(document)}
                >
                  {isDownloading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <FileDownloadOutlinedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
