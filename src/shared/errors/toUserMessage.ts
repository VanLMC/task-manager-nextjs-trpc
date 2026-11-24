import { TRPCClientError } from '@trpc/client';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function toUserMessage(error: unknown): string {
  if (error instanceof TRPCClientError && error.message) return error.message;
  return GENERIC_ERROR_MESSAGE;
}
