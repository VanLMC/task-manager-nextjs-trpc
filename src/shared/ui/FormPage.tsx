import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export function FormPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container maxWidth="sm" component="main" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          {title}
        </Typography>
        {children}
      </Paper>
    </Container>
  );
}
