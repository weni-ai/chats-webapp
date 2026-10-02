import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

import Copilot, {
  extractOriginalProjectUuid,
  extractSectorUuid,
} from '../copilot';
import http from '@/services/api/http';

describe('Copilot service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractSectorUuid', () => {
    it('reads sector from the list_connections payload', () => {
      expect(
        extractSectorUuid({
          sector: '0f73dc97-3d05-4bbb-bdd7-d96b23aff2c5',
          original_project_uuid: '234fe868-273c-494a-a353-fa2fa2350582',
          conection: {
            socketUrl: 'wss://websocket.weni.ai',
            channelUuid: '1d8ea7f5-8d60-4162-97bf-1f684914702d',
            host: 'https://flows.weni.ai',
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: '',
          },
        }),
      ).toBe('0f73dc97-3d05-4bbb-bdd7-d96b23aff2c5');
    });

    it('returns the sector uuid and ignores original_project_uuid', () => {
      expect(
        extractSectorUuid({
          original_project_uuid: 'origin-project-1',
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

    it('returns undefined when sector is missing', () => {
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

  describe('extractOriginalProjectUuid', () => {
    it('returns the original project uuid from the connection item', () => {
      expect(
        extractOriginalProjectUuid({
          sector: '0f73dc97-3d05-4bbb-bdd7-d96b23aff2c5',
          original_project_uuid: '234fe868-273c-494a-a353-fa2fa2350582',
          conection: {
            socketUrl: 'wss://websocket.weni.ai',
            channelUuid: '1d8ea7f5-8d60-4162-97bf-1f684914702d',
            host: 'https://flows.weni.ai',
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: '',
          },
        }),
      ).toBe('234fe868-273c-494a-a353-fa2fa2350582');
    });

    it('returns undefined when original_project_uuid is missing', () => {
      expect(
        extractOriginalProjectUuid({
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
