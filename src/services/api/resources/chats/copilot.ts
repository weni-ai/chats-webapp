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
