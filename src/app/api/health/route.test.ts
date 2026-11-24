import { GET } from './route';

describe('GET /api/health', () => {
  it('reports the service as healthy', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
