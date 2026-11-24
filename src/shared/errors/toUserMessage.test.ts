import { TRPCClientError } from '@trpc/client';
import { GENERIC_ERROR_MESSAGE, toUserMessage } from './toUserMessage';

describe('toUserMessage', () => {
  it('uses the API error message', () => {
    expect(toUserMessage(new TRPCClientError('Task was not found.'))).toBe('Task was not found.');
  });

  it('hides unexpected errors behind a generic message', () => {
    expect(toUserMessage(new Error('socket hang up'))).toBe(GENERIC_ERROR_MESSAGE);
    expect(toUserMessage('boom')).toBe(GENERIC_ERROR_MESSAGE);
  });
});
