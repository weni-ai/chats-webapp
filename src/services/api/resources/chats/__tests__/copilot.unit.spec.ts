import { vi, describe, it, expect, beforeEach } from 'vitest';

import Copilot from '../copilot';
import http from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

describe('Copilot service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConnections', () => {
    it('returns the mock connections without calling the API', async () => {
      const result = await Copilot.listConnections();

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('returns the mock connections regardless of isPrincipal', async () => {
      const result = await Copilot.listConnections({ isPrincipal: true });

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
