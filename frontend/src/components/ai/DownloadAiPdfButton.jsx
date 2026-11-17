/**
 * @file DownloadAiPdfButton.jsx
 * @description Action button that exports AI-generated quizzes, summaries, study
 * guides, or slides directly as a formatted PDF file.
 */

import { Button } from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import { getAiContentMeta } from '../../utils/aiContentMeta.js';
import { exportAiMaterialToPdf } from '../../utils/aiPdfExport.js';

/**
 * @param {object} props
 * @param {object|null} props.material
 * @param {(filename: string) => void} [props.onDownloaded]
 * @param {(error: Error) => void} [props.onError]
 */
export default function DownloadAiPdfButton({ material, onDownloaded, onError }) {
  const meta = getAiContentMeta(material?.contentType || 'quiz');
  const label = meta.downloadPdfLabel || `Descargar ${meta.shortLabel.toLowerCase()} en formato PDF`;

  const handleDownload = () => {
    try {
      const filename = exportAiMaterialToPdf(material);
      onDownloaded?.(filename);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      size="small"
      startIcon={<PictureAsPdfOutlinedIcon />}
      onClick={handleDownload}
      disabled={!material}
    >
      {label}
    </Button>
  );
}
