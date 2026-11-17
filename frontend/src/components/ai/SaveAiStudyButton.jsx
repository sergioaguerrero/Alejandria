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
 * @param {boolean} [props.fullWidth=false]
 * @param {() => void} props.onClick
 */
export default function SaveAiStudyButton({
  saved,
  disabled = false,
  fullWidth = false,
  onClick,
}) {
  return (
    <Button
      variant={saved ? 'contained' : 'outlined'}
      color={saved ? 'primary' : 'inherit'}
      size="small"
      fullWidth={fullWidth}
      startIcon={saved ? <BookmarkOutlinedIcon /> : <BookmarkBorderOutlinedIcon />}
      onClick={onClick}
      disabled={disabled}
      sx={{
        minWidth: fullWidth ? 0 : 176,
        whiteSpace: 'nowrap',
        border: '1px solid',
        ...(saved ? { borderColor: 'primary.main' } : {}),
      }}
    >
      {saved ? 'En Mi estudio' : 'Guardar en Mi estudio'}
    </Button>
  );
}
