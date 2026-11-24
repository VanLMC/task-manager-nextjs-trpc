'use client';

import { TRPCClientError } from '@trpc/client';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import type { AppRouter } from '@/server/routers/_app';
import { type CreateTaskInput, createTaskInput, type Task } from '../task.schema';

export type TaskFormValues = { title: string; description: string; completed: boolean };

export type TaskFormField = 'title' | 'description';

export type TaskFormErrors = Partial<Record<TaskFormField, string>>;

export const emptyTaskFormValues: TaskFormValues = { title: '', description: '', completed: false };

export function toTaskFormValues(task: Task): TaskFormValues {
  return { title: task.title, description: task.description ?? '', completed: task.completed };
}

function firstErrorPerField(fieldErrors: Record<string, string[] | undefined>): TaskFormErrors {
  return {
    title: fieldErrors.title?.[0],
    description: fieldErrors.description?.[0],
  };
}

type UseTaskFormOptions = {
  initialValues: TaskFormValues;
  onValidSubmit: (input: CreateTaskInput & { completed: boolean }) => void;
  onInvalid?: (fields: TaskFormField[]) => void;
};

export function useTaskForm({ initialValues, onValidSubmit, onInvalid }: UseTaskFormOptions) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<TaskFormErrors>({});

  const showErrors = (nextErrors: TaskFormErrors) => {
    setErrors(nextErrors);
    const invalidFields = (Object.keys(nextErrors) as TaskFormField[]).filter((f) => nextErrors[f]);
    if (invalidFields.length > 0) onInvalid?.(invalidFields);
    return invalidFields.length > 0;
  };

  return {
    values,
    errors,

    setField<Field extends keyof TaskFormValues>(field: Field, value: TaskFormValues[Field]) {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    },

    handleSubmit(event: FormEvent) {
      event.preventDefault();
      const result = createTaskInput.safeParse(values);
      if (!result.success) {
        showErrors(firstErrorPerField(z.flattenError(result.error).fieldErrors));
        return;
      }
      setErrors({});
      onValidSubmit({ ...result.data, completed: values.completed });
    },

    /** Shows server-side validation errors next to their fields; returns false if there were none. */
    showServerErrors(error: unknown): boolean {
      if (!(error instanceof TRPCClientError)) return false;
      const fieldErrors = (error as TRPCClientError<AppRouter>).data?.fieldErrors;
      return fieldErrors ? showErrors(firstErrorPerField(fieldErrors)) : false;
    },

    reset(nextValues: TaskFormValues) {
      setValues(nextValues);
      setErrors({});
    },
  };
}

export type TaskForm = ReturnType<typeof useTaskForm>;
