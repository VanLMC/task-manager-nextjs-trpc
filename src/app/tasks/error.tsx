'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { MAIN_CONTENT_ID } from '@/shared/ui/SkipLink';

export default function TasksError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container
      maxWidth="md"
      component="main"
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      sx={{ py: 4, outline: 'none' }}
    >
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reset}>
            Try again
          </Button>
        }
      >
        We could not load your tasks. Please try again.
      </Alert>
    </Container>
  );
}
