/**
 * @file DownloadAiPdfButton.jsx
 * @description Action button that exports AI-generated quizzes, summaries, study
 * guides, or slides directly as a formatted PDF file.
 */

import { useState } from 'react';

import { Button, CircularProgress, Tooltip } from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import { getAiContentMeta } from '../../utils/aiContentMeta.js';

/**
 * @param {object} props
 * @param {object|null} props.material
 * @param {boolean} [props.fullWidth=false]
 * @param {(filename: string) => void} [props.onDownloaded]
 * @param {(error: Error) => void} [props.onError]
 */
export default function DownloadAiPdfButton({ material, fullWidth = false, onDownloaded, onError }) {
  const [isExporting, setIsExporting] = useState(false);
  const meta = getAiContentMeta(material?.contentType || 'quiz');
  const tooltipLabel =
    meta.downloadPdfLabel || `Descargar ${meta.shortLabel.toLowerCase()} en formato PDF`;

  const handleDownload = async () => {
    if (!material || isExporting) return;
    setIsExporting(true);
    try {
      const { exportAiMaterialToPdf } = await import('../../utils/aiPdfExport.js');
      const filename = exportAiMaterialToPdf(material);
      onDownloaded?.(filename);
    } catch (error) {
      onError?.(error);
    } finally {
      setIsExporting(false);
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
          startIcon={
            isExporting ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfOutlinedIcon />
          }
          onClick={handleDownload}
          disabled={!material || isExporting}
          aria-label={tooltipLabel}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {isExporting ? 'Generando...' : 'Descargar'}
        </Button>
      </span>
    </Tooltip>
  );
}
