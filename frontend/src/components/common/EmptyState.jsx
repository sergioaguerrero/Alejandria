/**
 * @file EmptyState.jsx
 * @description Shared "there is nothing to show" state of the listings.
 *
 * Reused by the views with lists (repository documents, search results,
 * my contents) so that the empty case always looks the same.
 */

import { Box, Stack, Typography } from '@mui/material';

/**
 * @param {object} props
 * @param {import('react').ElementType} [props.icon]  Icon shown on top.
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]  Optional call to action.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Stack spacing={1} sx={{ py: 6, alignItems: 'center', textAlign: 'center' }}>
      {Icon && <Icon sx={{ fontSize: 40, color: 'text.secondary' }} />}

      <Typography variant="h6" component="p">
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}

      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}
