import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function TasksPage() {
  return (
    <Container maxWidth="md" component="main" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1">
        Tasks
      </Typography>
    </Container>
  );
}
