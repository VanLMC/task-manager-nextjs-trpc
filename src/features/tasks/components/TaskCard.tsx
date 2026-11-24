'use client';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { formatTaskDate } from '@/features/tasks/formatTaskDate';
import type { Task } from '@/features/tasks/task.schema';

type TaskCardProps = {
  task: Task;
  isBusy: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskCard({ task, isBusy, onToggle, onDelete }: TaskCardProps) {
  return (
    <Card component="article" variant="outlined" aria-labelledby={`task-${task.id}-title`}>
      <CardContent sx={{ pb: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Checkbox
            checked={task.completed}
            disabled={isBusy}
            onChange={() => onToggle(task)}
            slotProps={{ input: { 'aria-label': `Mark "${task.title}" as completed` } }}
            sx={{ mt: -0.75, ml: -1 }}
          />
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography
              id={`task-${task.id}-title`}
              variant="h6"
              component="h2"
              sx={{
                wordBreak: 'break-word',
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {task.description}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Created{' '}
              <time dateTime={task.createdAt.toISOString()}>{formatTaskDate(task.createdAt)}</time>
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button component={Link} href={`/tasks/${task.id}/edit`} size="small">
          Edit
        </Button>
        <Button
          size="small"
          color="error"
          disabled={isBusy}
          onClick={() => onDelete(task)}
          aria-label={`Delete "${task.title}"`}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}
