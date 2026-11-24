'use client';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Link from 'next/link';
import type { ReactNode, RefObject } from 'react';
import type { TaskForm as TaskFormState } from '../hooks/useTaskForm';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../task.schema';

type TaskFormProps = {
  form: TaskFormState;
  submitLabel: string;
  isSubmitting: boolean;
  titleInputRef: RefObject<HTMLInputElement | null>;
  showCompleted?: boolean;
  notice?: ReactNode;
};

export function TaskForm({
  form,
  submitLabel,
  isSubmitting,
  titleInputRef,
  showCompleted = false,
  notice,
}: TaskFormProps) {
  const { values, errors, setField, handleSubmit } = form;

  return (
    <Stack component="form" noValidate spacing={3} onSubmit={handleSubmit}>
      {notice}
      <TextField
        label="Title"
        required
        autoFocus
        value={values.title}
        onChange={(event) => setField('title', event.target.value)}
        error={Boolean(errors.title)}
        helperText={errors.title ?? `${values.title.length}/${TITLE_MAX_LENGTH}`}
        inputRef={titleInputRef}
        slotProps={{ htmlInput: { maxLength: TITLE_MAX_LENGTH } }}
      />
      <TextField
        label="Description"
        multiline
        minRows={3}
        value={values.description}
        onChange={(event) => setField('description', event.target.value)}
        error={Boolean(errors.description)}
        helperText={errors.description ?? `${values.description.length}/${DESCRIPTION_MAX_LENGTH}`}
        slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX_LENGTH } }}
      />
      {showCompleted && (
        <FormControlLabel
          label="Completed"
          control={
            <Checkbox
              checked={values.completed}
              onChange={(event) => setField('completed', event.target.checked)}
            />
          }
        />
      )}
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button component={Link} href="/tasks" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
