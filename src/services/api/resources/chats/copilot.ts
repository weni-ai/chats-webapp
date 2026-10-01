import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import getEnv from '@/utils/env';

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
  sector?: string;
  project_uuid?: string;
  original_project_uuid?: string;
};

type ListConnectionsParams = {
  isPrincipal?: boolean;
};

function readUuid(value?: string): string | undefined {
  return value?.trim() || undefined;
}

export function extractSectorUuid(
  item?: CopilotConnectionItem | null,
): string | undefined {
  return readUuid(item?.sector);
}

export function extractOriginalProjectUuid(
  item?: CopilotConnectionItem | null,
): string | undefined {
  return readUuid(item?.original_project_uuid);
}

function isCopilotMockAllowed() {
  return (
    process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production'
  );
}

export function getMockCopilotConnection(): CopilotConnection | null {
  if (!isCopilotMockAllowed()) {
    return null;
  }

  const channelUuid = getEnv('COPILOT_MOCK_CHANNEL_UUID')?.trim();
  const socketUrl = getEnv('COPILOT_MOCK_SOCKET_URL')?.trim();
  const host = getEnv('COPILOT_MOCK_HOST')?.trim();

  if (!channelUuid || !socketUrl || !host) {
    return null;
  }

  return {
    socketUrl,
    channelUuid,
    host,
    connectOn: 'mount',
    storage: 'local',
    callbackUrl: getEnv('COPILOT_MOCK_CALLBACK_URL')?.trim() || '',
  };
}

function buildMockConnectionItems(): CopilotConnectionItem[] {
  const mock = getMockCopilotConnection();
  if (!mock) {
    return [];
  }

  const items: CopilotConnectionItem[] = [{ conection: mock }];
  const principalRaw = getEnv('COPILOT_MOCK_PRINCIPAL_CONNECTIONS')?.trim();

  if (principalRaw) {
    principalRaw.split(',').forEach((sectorUuid) => {
      const trimmed = sectorUuid.trim();
      if (!trimmed) {
        return;
      }

      items.push({
        sector: trimmed,
        conection: mock,
      });
    });
  }

  return items;
}

export default {
  async listConnections({
    isPrincipal = false,
  }: ListConnectionsParams = {}): Promise<CopilotConnectionItem[]> {
    // MOCK TEMPORÁRIO — usa COPILOT_MOCK_* do .env e não chama o endpoint.
    // Para desligar: comente/apague as vars no .env. Para remover o código:
    // delete getMockCopilotConnection / buildMockConnectionItems e este if.
    const mockItems = buildMockConnectionItems();
    if (mockItems.length) {
      console.info(
        '[Copilot] using COPILOT_MOCK_* from .env (list_connections skipped)',
      );
      return mockItems;
    }

    const projectUuid = getProject();
    const response = await http.get<CopilotConnectionItem[]>(
      `/project/${projectUuid}/copilot/list_connections`,
      { params: { is_principal: isPrincipal } },
    );
    return response.data;
  },
};
