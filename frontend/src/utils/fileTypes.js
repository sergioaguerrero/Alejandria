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
 * Describes a file by its extension.
 * @param {string} [extension]
 * @returns {{ label: string, Icon: import('react').ElementType }}
 */
export function fileTypeInfo(extension) {
  const value = String(extension ?? '').toLowerCase();

  return GROUPS.find((group) => group.extensions.includes(value)) ?? FALLBACK;
}
