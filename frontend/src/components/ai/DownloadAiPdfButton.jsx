/**
 * @file DownloadAiPdfButton.jsx
 * @description Action button that exports AI-generated quizzes, summaries, study
 * guides, or slides directly as a formatted PDF file.
 */

import { Button, Tooltip } from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import { getAiContentMeta } from '../../utils/aiContentMeta.js';
import { exportAiMaterialToPdf } from '../../utils/aiPdfExport.js';

/**
 * @param {object} props
 * @param {object|null} props.material
 * @param {boolean} [props.fullWidth=false]
 * @param {(filename: string) => void} [props.onDownloaded]
 * @param {(error: Error) => void} [props.onError]
 */
export default function DownloadAiPdfButton({ material, fullWidth = false, onDownloaded, onError }) {
  const meta = getAiContentMeta(material?.contentType || 'quiz');
  const tooltipLabel =
    meta.downloadPdfLabel || `Descargar ${meta.shortLabel.toLowerCase()} en formato PDF`;

  const handleDownload = () => {
    try {
      const filename = exportAiMaterialToPdf(material);
      onDownloaded?.(filename);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <Tooltip title={tooltipLabel}>
      <span style={fullWidth ? { display: 'block', width: '100%' } : undefined}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          fullWidth={fullWidth}
          startIcon={<PictureAsPdfOutlinedIcon />}
          onClick={handleDownload}
          disabled={!material}
          aria-label={tooltipLabel}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Descargar
        </Button>
      </span>
    </Tooltip>
  );
}
