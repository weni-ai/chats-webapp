import http from '@/services/api/http';
import { getProject } from '@/utils/config';

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

export default {
  async listConnections({
    isPrincipal = false,
  }: ListConnectionsParams = {}): Promise<CopilotConnectionItem[]> {
    const projectUuid = getProject();
    const response = await http.get<CopilotConnectionItem[]>(
      `/project/${projectUuid}/copilot/list_connections`,
      { params: { is_principal: isPrincipal } },
    );
    return response.data;
  },
};
