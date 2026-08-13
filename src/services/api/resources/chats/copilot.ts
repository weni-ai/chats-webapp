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

const USE_MOCK_CONNECTIONS = true;

const MOCK_CONNECTIONS: CopilotConnectionItem[] = [];

export default {
  async listConnections({
    isPrincipal = false,
  }: ListConnectionsParams = {}): Promise<CopilotConnectionItem[]> {
    if (USE_MOCK_CONNECTIONS) {
      return MOCK_CONNECTIONS;
    }

    const projectUuid = getProject();
    const response = await http.get<CopilotConnectionItem[]>(
      `/project/${projectUuid}/copilot/list_connections`,
      { params: { is_principal: isPrincipal } },
    );
    return response.data;
  },
};
