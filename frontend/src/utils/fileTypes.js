/**
 * @file fileTypes.js
 * @description Icon and label of each file type, used by the document
 * listings and the preview of view 10.
 */

import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import TableChartIcon from '@mui/icons-material/TableChart';

/** Extensions grouped by the type of file they belong to. */
const GROUPS = [
  { extensions: ['pdf'], label: 'PDF', Icon: PictureAsPdfIcon },
  { extensions: ['doc', 'docx'], label: 'Word', Icon: DescriptionIcon },
  { extensions: ['ppt', 'pptx'], label: 'PowerPoint', Icon: SlideshowIcon },
  { extensions: ['xls', 'xlsx'], label: 'Excel', Icon: TableChartIcon },
  { extensions: ['jpg', 'jpeg', 'png'], label: 'Imagen', Icon: ImageIcon },
];

/** Used when the extension is unknown or missing. */
const FALLBACK = { label: 'Archivo', Icon: DescriptionIcon };

/** Extensions that the browser can preview inline (view 10). */
export const PREVIEWABLE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

/**
 * Indicates if the browser can preview the file of this extension.
 * @param {string} [extension]
 * @returns {boolean}
 */
export function isPreviewable(extension) {
  return PREVIEWABLE_EXTENSIONS.includes(String(extension ?? '').toLowerCase());
}

/**
 * Describes a file by its extension.
 * @param {string} [extension]
 * @returns {{ label: string, Icon: import('react').ElementType }}
 */
export function fileTypeInfo(extension) {
  const value = String(extension ?? '').toLowerCase();

  return GROUPS.find((group) => group.extensions.includes(value)) ?? FALLBACK;
}

/**
 * Triggers a browser file download from a URL or blob object URL.
 * @param {string} url
 * @param {string} [name]
 */
export function triggerFileDownload(url, name = 'documento') {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (typeof url === 'string' && url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
