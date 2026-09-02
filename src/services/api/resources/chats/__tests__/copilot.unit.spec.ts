import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/utils/env', () => ({
  default: vi.fn(),
}));

import Copilot, { buildMockConnections, extractSectorUuid } from '../copilot';
import http from '@/services/api/http';
import env from '@/utils/env';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

const MOCK_ENV = {
  COPILOT_MOCK_SOCKET_URL: 'wss://websocket.weni.ai',
  COPILOT_MOCK_HOST: 'https://flows.weni.ai',
  COPILOT_MOCK_CHANNEL_UUID: 'channel-default',
  COPILOT_MOCK_CALLBACK_URL: 'https://callback.example.com',
};

function mockEnv(values: Record<string, string | undefined> = MOCK_ENV) {
  env.mockImplementation((name: string) => values[name]);
}

describe('Copilot service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv();
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

  describe('buildMockConnections', () => {
    it('returns an empty list when the default channel uuid is missing', () => {
      mockEnv({
        ...MOCK_ENV,
        COPILOT_MOCK_CHANNEL_UUID: undefined,
      });

      expect(buildMockConnections(false)).toEqual([]);
    });

    it('returns a single connection when isPrincipal is false', () => {
      expect(buildMockConnections(false)).toEqual([
        {
          conection: {
            socketUrl: MOCK_ENV.COPILOT_MOCK_SOCKET_URL,
            channelUuid: MOCK_ENV.COPILOT_MOCK_CHANNEL_UUID,
            host: MOCK_ENV.COPILOT_MOCK_HOST,
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: MOCK_ENV.COPILOT_MOCK_CALLBACK_URL,
          },
        },
      ]);
    });

    it('returns one connection per sector when isPrincipal is true', () => {
      mockEnv({
        ...MOCK_ENV,
        COPILOT_MOCK_PRINCIPAL_CONNECTIONS: JSON.stringify([
          { sector: 'sector-1', channelUuid: 'channel-1' },
          {
            sector: 'sector-2',
            channelUuid: 'channel-2',
            socketUrl: 'wss://other.weni.ai',
          },
        ]),
      });

      expect(buildMockConnections(true)).toEqual([
        {
          sector: 'sector-1',
          conection: {
            socketUrl: MOCK_ENV.COPILOT_MOCK_SOCKET_URL,
            channelUuid: 'channel-1',
            host: MOCK_ENV.COPILOT_MOCK_HOST,
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: MOCK_ENV.COPILOT_MOCK_CALLBACK_URL,
          },
        },
        {
          sector: 'sector-2',
          conection: {
            socketUrl: 'wss://other.weni.ai',
            channelUuid: 'channel-2',
            host: MOCK_ENV.COPILOT_MOCK_HOST,
            connectOn: 'mount',
            storage: 'local',
            callbackUrl: MOCK_ENV.COPILOT_MOCK_CALLBACK_URL,
          },
        },
      ]);
    });

    it('returns an empty list when principal connections JSON is invalid', () => {
      mockEnv({
        ...MOCK_ENV,
        COPILOT_MOCK_PRINCIPAL_CONNECTIONS: '{not-json',
      });

      expect(buildMockConnections(true)).toEqual([]);
    });
  });

  describe('listConnections', () => {
    it('returns the mock connections without calling the API', async () => {
      const result = await Copilot.listConnections();

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toEqual(buildMockConnections(false));
    });

    it('returns principal mock connections without calling the API', async () => {
      mockEnv({
        ...MOCK_ENV,
        COPILOT_MOCK_PRINCIPAL_CONNECTIONS: JSON.stringify([
          { sector: 'sector-1', channelUuid: 'channel-1' },
        ]),
      });

      const result = await Copilot.listConnections({ isPrincipal: true });

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toEqual(buildMockConnections(true));
    });
  });
});
