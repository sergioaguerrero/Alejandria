/**
 * @file DocumentForm.jsx
 * @description Form to upload (view 9) and edit (view 13) a document.
 *
 * Holds the fields, the file and the required declaration. It validates on the
 * client, calls the `onSubmit` it receives with the data and shows both the
 * field errors and the general error (with a retry action) by itself, so the
 * pages only have to load the data and talk to the service.
 */

import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  LinearProgress,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import FileUploader from './FileUploader.jsx';
import TagInput from './TagInput.jsx';
import { MATERIAL_TYPES, SUGGESTED_TAGS, TERMS } from '../../mocks/catalogs.js';
import { SELECT_MENU_PROPS } from '../../utils/selectMenuProps.js';
import { validateFile } from '../../utils/validations.js';

/** Empty values of the form. */
const EMPTY_VALUES = {
  title: '',
  description: '',
  type: '',
  term: '',
  topic: '',
  tags: [],
};

/**
 * @typedef {object} DocumentFormValues
 * @property {string} title
 * @property {string} description
 * @property {string} type
 * @property {number|string} term
 * @property {string} topic
 * @property {string[]} tags
 */

/**
 * Validates the form on the client before calling the service.
 * @param {DocumentFormValues} values
 * @param {File|null} file
 * @param {{ requireFile: boolean }} options
 * @returns {Record<string, string>}
 */
function validate(values, file, { requireFile }) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (values.title.trim().length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres.';
  }
  if (values.description.trim().length < 10) {
    errors.description = 'Describe el documento en al menos 10 caracteres.';
  }
  if (!values.type) {
    errors.type = 'Selecciona el tipo de material.';
  }
  if (!values.term) {
    errors.term = 'Selecciona el corte.';
  }
  if (values.topic.trim().length < 3) {
    errors.topic = 'Escribe el tema del documento.';
  }

  if (requireFile || file) {
    const fileError = validateFile(file);
    if (fileError) errors.file = fileError;
  }

  return errors;
}

/** Copies the errors object without a field. */
function withoutField(errors, field) {
  if (!errors[field]) return errors;

  const next = { ...errors };
  delete next[field];
  return next;
}

/**
 * @param {object} props
 * @param {Partial<DocumentFormValues>} [props.initialValues]
 * @param {object|null} [props.currentFile]  File already saved (view 13).
 * @param {boolean} [props.requireFile]  The file is mandatory when uploading.
 * @param {string} [props.submitLabel]
 * @param {import('react').ReactNode} [props.submitIcon]
 * @param {number|null} [props.progress]  Upload progress (0-100), or null.
 * @param {string} [props.progressLabel]
 * @param {string} [props.busyLabel]
 * @param {(data: DocumentFormValues & { file: File|null }) => Promise<void>} props.onSubmit
 * @param {() => void} [props.onCancel]
 */
export default function DocumentForm({
  initialValues,
  currentFile = null,
  requireFile = true,
  submitLabel = 'Subir documento',
  submitIcon = <UploadFileIcon />,
  progress = null,
  progressLabel = 'Subiendo…',
  busyLabel = 'Subiendo…',
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({ ...EMPTY_VALUES, ...initialValues }));
  const [file, setFile] = useState(/** @type {File|null} */ (null));
  const [declaration, setDeclaration] = useState(false);
  const [clientErrors, setClientErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [serverErrors, setServerErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Visible error of a field: the API one wins over the client one. */
  const errorFor = (field) => serverErrors[field] ?? clientErrors[field];

  /** Clears the errors of a field while the user fixes it. */
  const clearErrors = (field) => {
    setClientErrors((previous) => withoutField(previous, field));
    setServerErrors((previous) => withoutField(previous, field));
  };

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [field]: value }));
    clearErrors(field);
  };

  const handleFileChange = (selected) => {
    setFile(selected);
    clearErrors('file');
  };

  const handleTagsChange = (tags) => {
    setValues((previous) => ({ ...previous, tags }));
    clearErrors('tags');
  };

  const submit = async () => {
    const errors = validate(values, file, { requireFile });
    setClientErrors(errors);
    setServerErrors({});
    setGeneralError('');

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      await onSubmit({ ...values, file });
    } catch (error) {
      if (error?.fields) setServerErrors(error.fields);
      setGeneralError(error?.message ?? 'No se pudo guardar el documento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        {generalError && (
          <Alert
            severity="error"
            action={
              // Retry only makes sense when it was not a field validation error.
              Object.keys(serverErrors).length === 0 ? (
                <Button color="inherit" size="small" onClick={submit} disabled={isSubmitting}>
                  Reintentar
                </Button>
              ) : null
            }
          >
            {generalError}
          </Alert>
        )}

        {/* The file goes on the left and the metadata on the right, so the form
            uses the whole width; on small screens everything stacks. */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'minmax(280px, 2fr) minmax(0, 3fr)',
            },
          }}
        >
          <FileUploader
            file={file}
            currentFile={currentFile}
            onChange={handleFileChange}
            error={errorFor('file')}
            disabled={isSubmitting}
          />

          <Stack spacing={3}>
            <TextField
              label="Título"
              value={values.title}
              onChange={setField('title')}
              error={Boolean(errorFor('title'))}
              helperText={errorFor('title') ?? 'El nombre con el que verán el documento.'}
              disabled={isSubmitting}
            />

            <TextField
              label="Descripción"
              value={values.description}
              onChange={setField('description')}
              error={Boolean(errorFor('description'))}
              helperText={errorFor('description')}
              multiline
              minRows={3}
              disabled={isSubmitting}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Tipo de material"
                value={values.type}
                onChange={setField('type')}
                error={Boolean(errorFor('type'))}
                helperText={errorFor('type')}
                slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
                disabled={isSubmitting}
              >
                {MATERIAL_TYPES.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Corte"
                value={values.term}
                onChange={setField('term')}
                error={Boolean(errorFor('term'))}
                helperText={errorFor('term')}
                slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
                disabled={isSubmitting}
              >
                {TERMS.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Tema"
              value={values.topic}
              onChange={setField('topic')}
              error={Boolean(errorFor('topic'))}
              helperText={errorFor('topic') ?? 'Tema o unidad que cubre el documento.'}
              disabled={isSubmitting}
            />

            <TagInput
              value={values.tags}
              onChange={handleTagsChange}
              options={SUGGESTED_TAGS}
              error={errorFor('tags')}
              disabled={isSubmitting}
            />
          </Stack>
        </Box>

        <Divider />

        <FormControlLabel
          control={
            <Checkbox
              checked={declaration}
              onChange={(event) => setDeclaration(event.target.checked)}
              disabled={isSubmitting}
            />
          }
          label={
            <Typography variant="body2">
              Declaro que este material es de mi autoría o tengo derecho a compartirlo, y que no es
              un examen vigente. Cumplo las{' '}
              <Link
                component={RouterLink}
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                normas de uso
              </Link>
              .
            </Typography>
          }
        />

        {progress !== null && (
          <Box>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              {`${progressLabel} ${progress}%`}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button variant="text" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}

          <Button
            type="submit"
            startIcon={submitIcon}
            disabled={!declaration || isSubmitting}
          >
            {isSubmitting ? busyLabel : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
