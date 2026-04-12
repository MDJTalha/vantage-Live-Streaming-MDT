import { apiFetch, apiGet, apiPost, getApiBaseUrl } from '../lib/api';

describe('api.ts - Centralized API Client', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    localStorage.clear();
  });

  describe('apiFetch', () => {
    it('should make authenticated request when token exists', async () => {
      localStorage.setItem('accessToken', 'test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      await apiFetch('http://localhost:4000/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should skip auth when skipAuth is true', async () => {
      localStorage.setItem('accessToken', 'test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await apiFetch('http://localhost:4000/api/test', { skipAuth: true });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });

  describe('apiGet', () => {
    it('should parse response data correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1, name: 'test' } }),
      });

      const result = await apiGet<{ id: number; name: string }>('http://localhost:4000/api/test');
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should throw on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(apiGet('http://localhost:4000/api/test')).rejects.toThrow('404');
    });
  });

  describe('apiPost', () => {
    it('should send POST request with body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 1 } }),
      });

      const result = await apiPost<{ id: number }>('http://localhost:4000/api/test', { name: 'test' });
      expect(result).toEqual({ id: 1 });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      );
    });
  });

  describe('getApiBaseUrl', () => {
    it('should return the configured API URL', () => {
      const url = getApiBaseUrl();
      expect(url).toBe('http://localhost:4000');
    });
  });
});
