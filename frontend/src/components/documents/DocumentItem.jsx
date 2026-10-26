/**
 * @file DocumentItem.jsx
 * @description Document row of the listings (view 7; reused in views 11 and 12).
 *
 * Shows the title, the material type, the topic and the tag chips. Clicking it
 * opens the document detail (view 10).
 */

import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { MATERIAL_TYPES } from '../../mocks/catalogs.js';
import { fileTypeInfo } from '../../utils/fileTypes.js';

/** Type value → label in Spanish. */
const TYPE_LABELS = Object.fromEntries(MATERIAL_TYPES.map(({ value, label }) => [value, label]));

/**
 * @param {object} props
 * @param {object} props.document  Document enriched by the service.
 */
export default function DocumentItem({ document }) {
  const { Icon } = fileTypeInfo(document.file?.extension);
  const typeLabel = TYPE_LABELS[document.type] ?? document.type;

  return (
    <Card>
      {/* TODO(FE-16): the document detail (view 10) is the next story. */}
      <CardActionArea component={RouterLink} to={`/documents/${document.id}`}>
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
    </Card>
  );
}
