import { buildContentSecurityPolicy, createNonce } from './content-security-policy';

describe('content security policy', () => {
  it('allows only nonced scripts and styles, and forbids framing', () => {
    const policy = buildContentSecurityPolicy('abc123');

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).toContain("style-src 'self' 'nonce-abc123'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain('unsafe-eval');
  });

  it("allows 'unsafe-eval' only in development", () => {
    expect(buildContentSecurityPolicy('n', { isDevelopment: true })).toContain("'unsafe-eval'");
  });

  it('creates a different nonce each time', () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});
