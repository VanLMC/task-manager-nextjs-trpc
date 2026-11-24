import { readRequestMetadata } from './trpc';

describe('readRequestMetadata', () => {
  it('trusts only the proxy-appended (last) forwarded IP and keeps the request id', () => {
    const headers = new Headers({
      'x-forwarded-for': '6.6.6.6, 198.51.100.7',
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
