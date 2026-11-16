/**
 * @file ReportDialog.jsx
 * @description Report dialog shared by the repository, document and public
 * profile views (FE-23).
 *
 * The visitor picks one of the reasons of the catalog and can add a comment.
 * The dialog sends the report itself and notifies the page with `onReported`
 * so it can close the dialog and show the confirmation.
 */

import { useState } from 'react';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';

import { REPORT_REASONS } from '../../mocks/catalogs.js';
import { createReport } from '../../services/index.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';

/** Human name of the reported element. */
const TARGET_NAMES = {
  repository: 'repositorio',
  document: 'documento',
  profile: 'perfil',
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {'repository'|'document'|'profile'} props.targetType
 * @param {string} props.targetId  Repository/document id, or the username of the profile.
 * @param {string} props.targetLabel  Name shown to confirm what is being reported.
 * @param {() => void} props.onClose
 * @param {() => void} props.onReported
 */
export default function ReportDialog({
  open,
  targetType,
  targetId,
  targetLabel,
  onClose,
  onReported,
}) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setReason('');
    setComment('');
    setError('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError('');

    if (!reason) {
      setError('Selecciona el motivo del reporte.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReport({ targetType, targetId, targetLabel, reason, comment });
      reset();
      onReported();
    } catch (serviceError) {
      setError(serviceError?.message ?? 'No se pudo enviar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{`Reportar ${TARGET_NAMES[targetType] ?? 'contenido'}`}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {`Vas a reportar: "${targetLabel}". El equipo de administración revisará el caso.`}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth required error={Boolean(error) && !reason}>
            <InputLabel id="report-reason-label">Motivo</InputLabel>
            <Select
              labelId="report-reason-label"
              label="Motivo"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              MenuProps={SELECT_MENU_PROPS}
              disabled={isSubmitting}
            >
              {REPORT_REASONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Elige el motivo que mejor describa el problema del contenido.
            </FormHelperText>
          </FormControl>

          <TextField
            label="Comentario (opcional)"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={isSubmitting}
            helperText="Cuéntanos qué pasa para que la revisión sea más rápida."
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="warning"
          startIcon={<FlagOutlinedIcon />}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando…' : 'Enviar reporte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
