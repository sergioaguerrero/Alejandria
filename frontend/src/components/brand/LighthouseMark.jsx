/**
 * @file LighthouseMark.jsx
 * @description Brand mark of Alejandría: a lighthouse inside a rounded square.
 *
 * The square uses the dark secondary blue and the lighthouse is drawn in a
 * reddish tone, so the shape reads on the dark palette. "Alejandría" alludes
 * to the Lighthouse of Alexandria, hence the symbol.
 */

import { Box, useTheme } from '@mui/material';

/** Reddish tone of the lighthouse over the dark square. */
const LIGHTHOUSE_COLOR = '#F87171';

/**
 * Brand mark: a lighthouse in a rounded dark square.
 * @param {object} props
 * @param {number} [props.size] Size in pixels of the lighthouse drawing.
 * @param {object} [props.sx]   Extra styles for the rounded square.
 * @returns {import('react').JSX.Element}
 */
export default function LighthouseMark({ size = 40, sx }) {
  const theme = useTheme();
  const padding = Math.round(size * 0.25);

  // Same as the square background, so the tower stripes look like gaps.
  const squareColor = theme.palette.secondary.main;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        width: 'fit-content',
        p: `${padding}px`,
        borderRadius: `${Math.round(size * 0.3)}px`,
        bgcolor: 'secondary.main',
        color: LIGHTHOUSE_COLOR,
        lineHeight: 0,
        ...sx,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        {/* Light beams */}
        <path d="M10.3 6.1 4 4.4v3.4l6.3-1.7Z" />
        <path d="M13.7 6.1 20 4.4v3.4l-6.3-1.7Z" />
        {/* Dome */}
        <path d="M12 3.1 13.9 5.3H10.1L12 3.1Z" />
        {/* Lamp room */}
        <rect x="10.1" y="5.3" width="3.8" height="2.4" rx="0.3" />
        {/* Gallery */}
        <rect x="8.5" y="7.7" width="7" height="1.4" rx="0.4" />
        {/* Tower */}
        <path d="M9.9 9.1h4.2l1.5 9.7H8.4L9.9 9.1Z" />
        {/* Stripes that read as gaps between the tower bands */}
        <rect x="9.2" y="12.1" width="5.6" height="1.2" fill={squareColor} />
        <rect x="8.6" y="15.3" width="6.8" height="1.2" fill={squareColor} />
        {/* Base */}
        <rect x="6.6" y="18.6" width="10.8" height="2.6" rx="0.6" />
      </svg>
    </Box>
  );
}
