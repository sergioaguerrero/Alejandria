/**
 * @file ConfirmDialog.jsx
 * @description Confirmation dialog shared by the destructive actions
 * (delete repository, delete document and the moderation actions).
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {boolean} [props.isBusy]      Disables the buttons while the action runs.
 * @param {string} [props.confirmColor]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onClose
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isBusy = false,
  confirmColor = 'error',
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ color: 'text.secondary' }}>{message}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isBusy}>
          {cancelLabel}
        </Button>

        <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={isBusy}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
