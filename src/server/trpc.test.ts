import { readRequestMetadata } from './trpc';

describe('readRequestMetadata', () => {
  it('uses the first forwarded IP and the incoming request id', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.7, 10.0.0.1',
      'x-request-id': 'abc',
    });

    expect(readRequestMetadata(headers)).toEqual({ clientIp: '198.51.100.7', requestId: 'abc' });
  });

  it('falls back to no IP and a generated request id', () => {
    const metadata = readRequestMetadata(new Headers());

    expect(metadata.clientIp).toBeNull();
    expect(metadata.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
