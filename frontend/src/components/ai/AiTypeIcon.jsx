/**
 * @file AiTypeIcon.jsx
 * @description Renders the semantic Material UI icon for an AI content type (FE-34).
 */

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';

export default function AiTypeIcon({ type, ...props }) {
  switch (type) {
    case 'summary':
      return <SummarizeOutlinedIcon {...props} />;
    case 'guide':
      return <MenuBookOutlinedIcon {...props} />;
    case 'slides':
      return <SlideshowOutlinedIcon {...props} />;
    case 'quiz':
    default:
      return <QuizOutlinedIcon {...props} />;
  }
}
