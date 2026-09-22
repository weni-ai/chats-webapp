import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

import Copilot, { extractSectorUuid } from '../copilot';
import http from '@/services/api/http';

describe('Copilot service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractSectorUuid', () => {
    it('returns the sector uuid from a sector key', () => {
      expect(
        extractSectorUuid({
          sector: 'sector-1',
          conection: {
            socketUrl: 'wss://example.com',
            channelUuid: 'channel-1',
            host: 'https://flows.weni.ai',
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: '',
          },
        }),
      ).toBe('sector-1');
    });

    it('returns the value of the first non-conection key', () => {
      expect(
        extractSectorUuid({
          'sector-uuid': 'sector-uuid',
          conection: {
            socketUrl: 'wss://example.com',
            channelUuid: 'channel-1',
            host: 'https://flows.weni.ai',
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: '',
          },
        }),
      ).toBe('sector-uuid');
    });

    it('returns undefined when there is no sector key', () => {
      expect(
        extractSectorUuid({
          conection: {
            socketUrl: 'wss://example.com',
            channelUuid: 'channel-1',
            host: 'https://flows.weni.ai',
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: '',
          },
        }),
      ).toBeUndefined();
    });
  });

  describe('listConnections', () => {
    it('fetches connections for a non-principal project', async () => {
      const payload = [
        {
          conection: {
            socketUrl: 'wss://websocket.weni.ai',
            channelUuid: 'channel-1',
            host: 'https://flows.weni.ai',
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: '',
          },
        },
      ];
      http.get.mockResolvedValue({ data: payload });

      const result = await Copilot.listConnections();

      expect(http.get).toHaveBeenCalledWith(
        '/project/mocked-project-id/copilot/list_connections',
        { params: { is_principal: false } },
      );
      expect(result).toEqual(payload);
    });

    it('fetches connections for a principal project', async () => {
      http.get.mockResolvedValue({ data: [] });

      await Copilot.listConnections({ isPrincipal: true });

      expect(http.get).toHaveBeenCalledWith(
        '/project/mocked-project-id/copilot/list_connections',
        { params: { is_principal: true } },
      );
    });
  });
});
