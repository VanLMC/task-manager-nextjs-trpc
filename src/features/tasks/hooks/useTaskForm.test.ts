import { act, renderHook } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import type { FormEvent } from 'react';
import { emptyTaskFormValues, toTaskFormValues, useTaskForm } from './useTaskForm';

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent;

function renderTaskForm(initialValues = emptyTaskFormValues) {
  const onValidSubmit = vi.fn();
  const onInvalid = vi.fn();
  const hook = renderHook(() => useTaskForm({ initialValues, onValidSubmit, onInvalid }));
  return { ...hook, onValidSubmit, onInvalid };
}

describe('useTaskForm', () => {
  it('blocks submission without a title and reports the invalid field', () => {
    const { result, onValidSubmit, onInvalid } = renderTaskForm();

    act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.errors.title).toBe('Title is required');
    expect(onValidSubmit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith(['title']);
  });

  it('clears a field error as soon as the field changes', () => {
    const { result } = renderTaskForm();
    act(() => result.current.handleSubmit(submitEvent()));

    act(() => result.current.setField('title', 'Fixed'));

    expect(result.current.errors.title).toBeUndefined();
  });

  it('submits trimmed values', () => {
    const { result, onValidSubmit } = renderTaskForm();
    act(() => result.current.setField('title', '  Plan trip  '));
    act(() => result.current.setField('description', ' Book flights '));

    act(() => result.current.handleSubmit(submitEvent()));

    expect(onValidSubmit).toHaveBeenCalledWith({
      title: 'Plan trip',
      description: 'Book flights',
      completed: false,
    });
  });

  it('shows server field errors and ignores other errors', () => {
    const { result } = renderTaskForm();
    const validationError = new TRPCClientError('Invalid input', {
      result: { error: { data: { fieldErrors: { title: ['Title is too long'] } } } },
    } as never);

    let shown = false;
    act(() => {
      shown = result.current.showServerErrors(validationError);
    });

    expect(shown).toBe(true);
    expect(result.current.errors.title).toBe('Title is too long');
    expect(result.current.showServerErrors(new Error('network'))).toBe(false);
  });

  it('resets to new values', () => {
    const { result } = renderTaskForm();
    const createdAt = new Date();

    act(() =>
      result.current.reset(
        toTaskFormValues({
          id: crypto.randomUUID(),
          title: 'Latest',
          completed: true,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    );

    expect(result.current.values).toEqual({ title: 'Latest', description: '', completed: true });
  });
});
