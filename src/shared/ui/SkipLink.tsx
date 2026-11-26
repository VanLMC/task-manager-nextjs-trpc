'use client';

import Box from '@mui/material/Box';

export const MAIN_CONTENT_ID = 'main-content';

export function SkipLink() {
  return (
    <Box
      component="a"
      href={`#${MAIN_CONTENT_ID}`}
      sx={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 'tooltip',
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        transform: 'translateY(-200%)',
        '&:focus': { transform: 'none' },
      }}
    >
      Skip to main content
    </Box>
  );
}
