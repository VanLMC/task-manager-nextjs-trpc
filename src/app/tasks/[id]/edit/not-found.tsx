import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { FormPage } from '@/shared/ui/FormPage';

export default function TaskNotFound() {
  return (
    <FormPage title="Task not found">
      <Typography sx={{ mb: 3 }}>This task does not exist or was deleted.</Typography>
      <Button component={Link} href="/tasks" variant="contained">
        Back to tasks
      </Button>
    </FormPage>
  );
}
