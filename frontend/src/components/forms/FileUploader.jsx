/**
 * @file FileUploader.jsx
 * @description Drop zone to choose the file of a document (views 9 and 13).
 *
 * Accepts drag & drop or a click on the zone. It only exposes the chosen
 * File; the type and size check stays in the form so the message shows up in
 * the same place as the other field errors.
 */

import { useRef, useState } from 'react';

import { Box, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { fileTypeInfo } from '../../utils/fileTypes.js';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  formatSize,
  getExtension,
} from '../../utils/validations.js';

/** Value of the `accept` attribute of the file input. */
const ACCEPT = ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',');

/** Human message of the allowed formats. */
const FORMATS = 'PDF, Word, PowerPoint, Excel, JPG o PNG';

/**
 * @param {object} props
 * @param {File|null} props.file
 * @param {{ name: string, extension?: string, sizeBytes?: number, size?: number }|null} [props.currentFile]
 *   File already saved, shown while no replacement is chosen (view 13).
 * @param {(file: File|null) => void} props.onChange
 * @param {string} [props.error]
 * @param {boolean} [props.disabled]
 */
export default function FileUploader({
  file,
  currentFile = null,
  onChange,
  error = '',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (event) => {
    const selected = event.target.files?.[0];
    if (selected) onChange(selected);
    // Lets the same file be chosen again after removing it.
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const selected = event.dataTransfer.files?.[0];
    if (selected) onChange(selected);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  // A saved file is shown while the author does not choose a new one.
  const shownFile = file ?? currentFile;
  const FileIcon = shownFile ? fileTypeInfo(getExtension(shownFile)).Icon : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={handleInputChange} />

      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Elegir el archivo del documento"
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 4,
          flexGrow: 1,
          textAlign: 'center',
          cursor: disabled ? 'default' : 'pointer',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: error ? 'error.main' : isDragging ? 'primary.main' : 'divider',
          bgcolor: isDragging ? 'action.hover' : 'transparent',
          transition: 'border-color 200ms, background-color 200ms',
          opacity: disabled ? 0.6 : 1,
          '&:hover': disabled ? undefined : { borderColor: 'primary.main' },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: error ? 'error.main' : 'primary.main' }} />

        <Typography variant="body2" color="text.secondary">
          {currentFile && !file
            ? 'Arrastra el archivo nuevo o haz clic para reemplazarlo'
            : 'Arrastra el archivo aquí o haz clic para elegirlo'}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {`${FORMATS} · máximo ${formatSize(MAX_FILE_SIZE_BYTES)}`}
        </Typography>
      </Box>

      {shownFile && FileIcon && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            mt: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <FileIcon sx={{ color: 'primary.main' }} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap>
              {shownFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`${formatSize(shownFile.size ?? shownFile.sizeBytes ?? 0)}${
                file ? '' : ' · archivo actual'
              }`}
            </Typography>
          </Box>

          {file && (
            <IconButton
              size="small"
              aria-label="Quitar archivo"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      )}

      {error && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
