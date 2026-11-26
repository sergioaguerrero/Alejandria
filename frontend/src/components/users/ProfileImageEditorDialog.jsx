/**
 * @file ProfileImageEditorDialog.jsx
 * @description Interactive modal to pick, frame (pan + zoom), save, or remove
 * the user's profile picture (avatar) or cover banner.
 */

import { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CenterFocusWeakOutlinedIcon from '@mui/icons-material/CenterFocusWeakOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import {
  DEFAULT_BANNER_GRADIENT,
  MAX_AVATAR_BYTES,
  MAX_BANNER_BYTES,
  PROFILE_IMAGE_ACCEPT,
  clampOffset,
  exportCroppedProfileImage,
  getCoverDimensions,
  resolveMediaUrl,
  validateProfileImageFile,
} from '../../utils/profileMedia.js';

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {'avatar'|'banner'} props.kind
 * @param {string|null|undefined} props.currentUrl
 * @param {string} [props.fallbackInitials]
 * @param {() => void} props.onClose
 * @param {(file: File) => Promise<void>} props.onSave
 * @param {() => Promise<void>} props.onRemove
 */
export default function ProfileImageEditorDialog({
  open,
  kind,
  currentUrl,
  fallbackInitials = '?',
  onClose,
  onSave,
  onRemove,
}) {
  const isBanner = kind === 'banner';
  const maxMb = Math.round((isBanner ? MAX_BANNER_BYTES : MAX_AVATAR_BYTES) / (1024 * 1024));
  const resolvedCurrentUrl = resolveMediaUrl(currentUrl);

  const fileInputRef = useRef(null);
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const dragStateRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: isBanner ? 480 : 240, height: isBanner ? 120 : 240 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const isBusy = isSaving || isRemoving;

  // Cleanup preview object URL on change/unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Keep frame size synchronized with actual rendered DOM dimensions
  useEffect(() => {
    const node = frameRef.current;
    if (!node || !previewUrl) return undefined;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [previewUrl, isBanner]);

  const loadSelectedFile = (file) => {
    if (!file) return;
    setError('');

    const validationError = validateProfileImageFile(file, kind);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    setNaturalSize({ width: 0, height: 0 });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    loadSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (isBusy) return;
    const file = event.dataTransfer?.files?.[0];
    loadSelectedFile(file);
  };

  const handleImageLoad = (event) => {
    const img = event.currentTarget;
    setNaturalSize({
      width: img.naturalWidth || 1,
      height: img.naturalHeight || 1,
    });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomChange = (_event, nextZoomValue) => {
    const nextZoom = Number(nextZoomValue);
    setZoom(nextZoom);
    setOffset((prev) =>
      clampOffset(prev, {
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        frameWidth: frameSize.width,
        frameHeight: frameSize.height,
        zoom: nextZoom,
      }),
    );
  };

  const handlePointerDown = (event) => {
    if (!previewUrl || !naturalSize.width || isBusy) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    setOffset(
      clampOffset(
        { x: state.originX + dx, y: state.originY + dy },
        {
          naturalWidth: naturalSize.width,
          naturalHeight: naturalSize.height,
          frameWidth: frameSize.width,
          frameHeight: frameSize.height,
          zoom,
        },
      ),
    );
  };

  const handlePointerUp = (event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleResetFraming = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!imgRef.current || !naturalSize.width) return;
    setError('');
    setIsSaving(true);
    try {
      const processedFile = await exportCroppedProfileImage({
        image: imgRef.current,
        kind,
        frameWidth: frameSize.width,
        frameHeight: frameSize.height,
        zoom,
        offset,
      });
      await onSave(processedFile);
      onClose();
    } catch (err) {
      setError(err?.fields?.file || err?.message || 'No se pudo guardar la imagen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    setIsRemoving(true);
    try {
      await onRemove();
      onClose();
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar la imagen.');
    } finally {
      setIsRemoving(false);
    }
  };

  const baseDims = getCoverDimensions(
    naturalSize.width,
    naturalSize.height,
    frameSize.width,
    frameSize.height,
  );

  return (
    <Dialog
      open={open}
      onClose={() => !isBusy && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          pb: 1,
        }}
      >
        <span>{isBanner ? 'Personalizar banner de perfil' : 'Personalizar foto de perfil'}</span>
        <IconButton
          size="small"
          aria-label="Cerrar editor de imagen"
          disabled={isBusy}
          onClick={onClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={PROFILE_IMAGE_ACCEPT}
          hidden
          onChange={handleFileInputChange}
        />

        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          {previewUrl ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Arrastra la imagen para encuadrarla y usa el control de zoom para ajustar el detalle.
              </Typography>

              {/* Interactive Framing Stage */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: { xs: 1.5, sm: 2.5 },
                  borderRadius: 2.5,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  userSelect: 'none',
                }}
              >
                <Box
                  ref={frameRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  sx={{
                    position: 'relative',
                    width: isBanner ? '100%' : { xs: 210, sm: 250 },
                    aspectRatio: isBanner ? '4 / 1' : '1 / 1',
                    borderRadius: isBanner ? 2.5 : '50%',
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    bgcolor: '#0B1220',
                    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.55), 0 10px 28px rgba(0, 0, 0, 0.32)',
                  }}
                >
                  <Box
                    ref={imgRef}
                    component="img"
                    src={previewUrl}
                    alt={isBanner ? 'Vista previa del banner' : 'Vista previa de la foto de perfil'}
                    draggable={false}
                    onLoad={handleImageLoad}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: `${baseDims.width}px`,
                      height: `${baseDims.height}px`,
                      maxWidth: 'none',
                      transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Box>

              {/* Zoom & Reset Controls */}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 0.5 }}>
                <ZoomOutIcon fontSize="small" color="action" />
                <Slider
                  aria-label="Nivel de zoom"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.05}
                  disabled={isBusy}
                  onChange={handleZoomChange}
                />
                <ZoomInIcon fontSize="small" color="action" />
                <Tooltip title="Centrar imagen">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Centrar imagen"
                      disabled={isBusy || (zoom === 1 && offset.x === 0 && offset.y === 0)}
                      onClick={handleResetFraming}
                    >
                      <CenterFocusWeakOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoCameraOutlinedIcon />}
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Elegir otra imagen
                </Button>
              </Box>
            </>
          ) : (
            <>
              {/* Current Preview */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                {isBanner ? (
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '4 / 1',
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundImage: resolvedCurrentUrl
                        ? `url("${resolvedCurrentUrl}")`
                        : DEFAULT_BANNER_GRADIENT,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: 'inset 0 0 36px rgba(0,0,0,0.35)',
                    }}
                  />
                ) : (
                  <Avatar
                    src={resolvedCurrentUrl}
                    sx={{
                      width: 112,
                      height: 112,
                      fontSize: '2.4rem',
                      fontWeight: 700,
                      bgcolor: '#F59E0B',
                      color: '#0B1220',
                      border: '3px solid',
                      borderColor: 'divider',
                      boxShadow: 2,
                    }}
                  >
                    {fallbackInitials}
                  </Avatar>
                )}

                <Typography variant="caption" color="text.secondary">
                  {resolvedCurrentUrl
                    ? isBanner
                      ? 'Banner actual de tu perfil'
                      : 'Foto de perfil actual'
                    : isBanner
                      ? 'Actualmente usas el banner institucional predeterminado'
                      : 'Actualmente muestras tus iniciales como avatar'}
                </Typography>
              </Box>

              {/* Clickable + Drag-and-drop File Picker */}
              <Paper
                variant="outlined"
                onClick={() => !isBusy && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isBusy) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isBusy) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  bgcolor: isDragOver ? 'action.selected' : 'action.hover',
                  textAlign: 'center',
                  cursor: isBusy ? 'default' : 'pointer',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <CloudUploadOutlinedIcon
                  sx={{ fontSize: 38, color: 'primary.main', mb: 1 }}
                />
                <Typography variant="subtitle2" fontWeight={700}>
                  Haz clic para elegir una imagen o arrástrala aquí
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {isBanner
                    ? `Formatos JPG, PNG o WebP · Máximo ${maxMb} MB · Recomendado formato panorámico (4:1)`
                    : `Formatos JPG, PNG o WebP · Máximo ${maxMb} MB · Se ajustará a formato cuadrado (1:1)`}
                </Typography>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1.5,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          {resolvedCurrentUrl && (
            <Button
              color="error"
              variant="text"
              size="small"
              startIcon={
                isRemoving ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlinedIcon />
              }
              disabled={isBusy}
              onClick={handleRemove}
            >
              {isBanner ? 'Restaurar banner' : 'Quitar foto'}
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} color="inherit" disabled={isBusy}>
            Cancelar
          </Button>
          {previewUrl ? (
            <Button
              variant="contained"
              disabled={isBusy || !naturalSize.width}
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
              onClick={handleSave}
            >
              {isSaving ? 'Guardando...' : isBanner ? 'Guardar banner' : 'Guardar foto'}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PhotoCameraOutlinedIcon />}
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              Seleccionar imagen
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
