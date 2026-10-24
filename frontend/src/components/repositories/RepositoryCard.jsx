/**
 * @file RepositoryCard.jsx
 * @description Summary card of a study repository (view 6, FE-10).
 *
 * Shows the name, the subject, the author and the likes. Clicking it opens
 * the repository detail (view 7, FE-12).
 */

import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Link as RouterLink } from 'react-router-dom';

/**
 * @param {object} props
 * @param {object} props.repository  Repository enriched by the service.
 */
export default function RepositoryCard({ repository }) {
  const subjectName = repository.subject?.name ?? 'Sin materia';

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/repositories/${repository.id}`}
        sx={{ height: '100%' }}
      >
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {repository.name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {repository.description}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 'auto', pt: 1 }}
          >
            <Chip label={subjectName} size="small" color="primary" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              @{repository.authorUsername}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <FavoriteBorderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {repository.likes}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
