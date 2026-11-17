/**
 * @file SaveAiStudyButton.jsx
 * @description Toggle button for saving AI study content to "Mi estudio" with
 * a fixed minimum width so toggling state never shifts surrounding buttons.
 */

import { Button } from '@mui/material';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import BookmarkOutlinedIcon from '@mui/icons-material/BookmarkOutlined';

/**
 * @param {object} props
 * @param {boolean} props.saved
 * @param {boolean} [props.disabled=false]
 * @param {() => void} props.onClick
 */
export default function SaveAiStudyButton({ saved, disabled = false, onClick }) {
  return (
    <Button
      variant={saved ? 'contained' : 'outlined'}
      color={saved ? 'primary' : 'inherit'}
      size="small"
      startIcon={saved ? <BookmarkOutlinedIcon /> : <BookmarkBorderOutlinedIcon />}
      onClick={onClick}
      disabled={disabled}
      sx={{ minWidth: 176, whiteSpace: 'nowrap' }}
    >
      {saved ? 'En Mi estudio' : 'Guardar en Mi estudio'}
    </Button>
  );
}
