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
    it('requests connections with is_principal false by default', async () => {
      const connections = [{ conection: { socketUrl: 'wss://example.com' } }];
      vi.mocked(http.get).mockResolvedValue({ data: connections });

      const result = await Copilot.listConnections();

      expect(http.get).toHaveBeenCalledWith(
        '/project/mocked-project-id/copilot/list_connections',
        { params: { is_principal: false } },
      );
      expect(result).toEqual(connections);
    });

    it('forwards isPrincipal true as is_principal param', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [] });

      await Copilot.listConnections({ isPrincipal: true });

      expect(http.get).toHaveBeenCalledWith(
        '/project/mocked-project-id/copilot/list_connections',
        { params: { is_principal: true } },
      );
    });
  });
});
