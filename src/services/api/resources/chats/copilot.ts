import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import env from '@/utils/env';

export type CopilotConnection = {
  socketUrl: string;
  channelUuid: string;
  host: string;
  connectOn: string;
  storage: string;
  callbackUrl: string;
};

export type CopilotConnectionItem = {
  conection: CopilotConnection;
  [key: string]: string | CopilotConnection;
};

type ListConnectionsParams = {
  isPrincipal?: boolean;
};

type MockPrincipalConnectionEntry = {
  callbackUrl?: string;
  channelUuid?: string;
  connectOn?: string;
  host?: string;
  sector?: string;
  socketUrl?: string;
  storage?: string;
};

const USE_MOCK_CONNECTIONS = true;
const CONNECTION_KEY = 'conection';

export function extractSectorUuid(
  item: CopilotConnectionItem,
): string | undefined {
  const sectorKey = Object.keys(item).find((key) => key !== CONNECTION_KEY);

  if (!sectorKey) {
    return undefined;
  }

  const value = item[sectorKey];
  return typeof value === 'string' && value ? value : undefined;
}

function getMockConnectionDefaults(): CopilotConnection {
  return {
    socketUrl: env('COPILOT_MOCK_SOCKET_URL') || '',
    channelUuid: env('COPILOT_MOCK_CHANNEL_UUID') || '',
    host: env('COPILOT_MOCK_HOST') || '',
    connectOn: 'mount',
    storage: 'local',
    callbackUrl: env('COPILOT_MOCK_CALLBACK_URL') || '',
  };
}

function buildConnection(
  overrides: Partial<CopilotConnection> = {},
): CopilotConnection {
  return {
    ...getMockConnectionDefaults(),
    ...overrides,
  };
}

function parsePrincipalConnections(): MockPrincipalConnectionEntry[] {
  const raw = env('COPILOT_MOCK_PRINCIPAL_CONNECTIONS');

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildMockConnections(
  isPrincipal = false,
): CopilotConnectionItem[] {
  const defaults = getMockConnectionDefaults();

  if (!isPrincipal) {
    if (!defaults.channelUuid) {
      return [];
    }

    return [{ conection: defaults }];
  }

  return parsePrincipalConnections()
    .filter((entry) => entry?.sector && entry?.channelUuid)
    .map((entry) => ({
      sector: entry.sector,
      conection: buildConnection({
        socketUrl: entry.socketUrl || defaults.socketUrl,
        channelUuid: entry.channelUuid,
        host: entry.host || defaults.host,
        connectOn: entry.connectOn || defaults.connectOn,
        storage: entry.storage || defaults.storage,
        callbackUrl: entry.callbackUrl ?? defaults.callbackUrl,
      }),
    }));
}

export default {
  async listConnections({
    isPrincipal = false,
  }: ListConnectionsParams = {}): Promise<CopilotConnectionItem[]> {
    if (USE_MOCK_CONNECTIONS) {
      return buildMockConnections(isPrincipal);
    }

    const projectUuid = getProject();
    const response = await http.get<CopilotConnectionItem[]>(
      `/project/${projectUuid}/copilot/list_connections`,
      { params: { is_principal: isPrincipal } },
    );
    return response.data;
  },
};
