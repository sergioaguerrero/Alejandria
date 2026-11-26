/**
 * @file profileMedia.js
 * @description Utilities for resolving, validating, framing and optimizing user profile
 * avatars and banners on the client before uploading to the backend.
 */

import { API_URL } from '../services/config.js';

export const PROFILE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB
export const MAX_BANNER_BYTES = 5 * 1024 * 1024; // 5 MB

export const DEFAULT_BANNER_GRADIENT =
  'linear-gradient(135deg, #0B1220 0%, #152944 35%, #1D3557 70%, #2563EB 100%)';

const API_ORIGIN = API_URL.replace(/\/api\/?$/i, '');

/**
 * Resolves a backend-relative media URL (e.g. `/api/users/1/avatar?v=...`) against the
 * configured API origin so images work in localhost, Vercel+Render, and mock mode (`data:`/`blob:`).
 *
 * @param {string|null|undefined} url
 * @returns {string|undefined}
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }
  return `${API_ORIGIN}/${trimmed}`;
}

/**
 * Validates a selected image file before loading it in the editor.
 *
 * @param {File|null|undefined} file
 * @param {'avatar'|'banner'} kind
 * @returns {string|null} Spanish validation error message, or null when valid.
 */
export function validateProfileImageFile(file, kind) {
  if (!file) {
    return 'Selecciona una imagen válida.';
  }

  const maxBytes = kind === 'banner' ? MAX_BANNER_BYTES : MAX_AVATAR_BYTES;
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  const ext = String(file.name ?? '').split('.').pop()?.toLowerCase() ?? '';
  const mime = String(file.type ?? '').toLowerCase();

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mime) && !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return 'Solo se permiten imágenes en formato JPG, PNG o WebP.';
  }

  if (file.size === 0) {
    return 'El archivo seleccionado está vacío.';
  }

  if (file.size > maxBytes) {
    return `La imagen supera el máximo permitido de ${maxMb} MB.`;
  }

  return null;
}

/**
 * Computes the base cover dimensions (before zoom) so an image completely fills a frame.
 *
 * @param {number} naturalWidth
 * @param {number} naturalHeight
 * @param {number} frameWidth
 * @param {number} frameHeight
 */
export function getCoverDimensions(naturalWidth, naturalHeight, frameWidth, frameHeight) {
  if (!naturalWidth || !naturalHeight || !frameWidth || !frameHeight) {
    return { width: frameWidth, height: frameHeight };
  }
  const scale = Math.max(frameWidth / naturalWidth, frameHeight / naturalHeight);
  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}

/**
 * Clamps pan offsets so the image never leaves empty gaps inside the crop frame.
 *
 * @param {{ x: number, y: number }} offset
 * @param {{ naturalWidth: number, naturalHeight: number, frameWidth: number, frameHeight: number, zoom: number }} params
 */
export function clampOffset(offset, { naturalWidth, naturalHeight, frameWidth, frameHeight, zoom }) {
  const base = getCoverDimensions(naturalWidth, naturalHeight, frameWidth, frameHeight);
  const renderedWidth = base.width * zoom;
  const renderedHeight = base.height * zoom;
  const maxX = Math.max(0, (renderedWidth - frameWidth) / 2);
  const maxY = Math.max(0, (renderedHeight - frameHeight) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

/**
 * Renders the framed image onto an offscreen HTML5 canvas and exports a crisp,
 * compressed WebP/JPEG File ready for upload.
 *
 * @param {object} params
 * @param {HTMLImageElement} params.image
 * @param {'avatar'|'banner'} params.kind
 * @param {number} params.frameWidth
 * @param {number} params.frameHeight
 * @param {number} params.zoom
 * @param {{ x: number, y: number }} params.offset
 * @returns {Promise<File>}
 */
export async function exportCroppedProfileImage({
  image,
  kind,
  frameWidth,
  frameHeight,
  zoom,
  offset,
}) {
  const outputWidth = kind === 'banner' ? 1440 : 512;
  const outputHeight = kind === 'banner' ? 360 : 512;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Tu navegador no permite procesar la imagen.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const base = getCoverDimensions(image.naturalWidth, image.naturalHeight, frameWidth, frameHeight);
  const renderedWidth = base.width * zoom;
  const renderedHeight = base.height * zoom;

  const scaleToOutputX = outputWidth / frameWidth;
  const scaleToOutputY = outputHeight / frameHeight;

  const drawWidth = renderedWidth * scaleToOutputX;
  const drawHeight = renderedHeight * scaleToOutputY;
  const drawX = (outputWidth - drawWidth) / 2 + offset.x * scaleToOutputX;
  const drawY = (outputHeight - drawHeight) / 2 + offset.y * scaleToOutputY;

  ctx.fillStyle = '#0B1220';
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve(webpBlob);
          return;
        }
        canvas.toBlob(
          (jpegBlob) => {
            if (jpegBlob) resolve(jpegBlob);
            else reject(new Error('No se pudo procesar la imagen seleccionada.'));
          },
          'image/jpeg',
          0.9,
        );
      },
      'image/webp',
      0.88,
    );
  });

  const mime = blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const ext = mime === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${kind}.${ext}`, { type: mime });
}

/**
 * Converts a File/Blob into a Data URL (used in mock mode to persist previewable images).
 *
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(blob);
  });
}
