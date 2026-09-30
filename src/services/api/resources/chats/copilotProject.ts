import http from '@/services/api/http';

export type CopilotProject = {
  name: string;
  assignedAgents: number;
  createdOn: string;
  connectedOn: string;
  uuid: string;
  projectUuid?: string;
  connectedBy?: string;
  isConnected: boolean;
  disconnectedBy?: string;
  disconnectedOn?: string;
};

type CopilotProjectResponse = {
  name?: string;
  assigned_agents?: number;
  created_on?: string;
  connected_on?: string;
  uuid?: string;
  project_uuid?: string;
  connected_by?: string;
  connect_by?: string;
  is_connected?: boolean;
  disconnect_by?: string;
  disconnect_on?: string;
};

const IS_MOCKED = false;

const MOCKED_COPILOT_PROJECT: CopilotProject = {
  name: 'Desk Copilot',
  assignedAgents: 0,
  createdOn: new Date().toISOString(),
  connectedOn: new Date().toISOString(),
  uuid: '1234567890',
  projectUuid: 'project-1234567890',
  connectedBy: 'test@example.com',
  isConnected: true,
};

export function normalizeCopilotProject(data: unknown): CopilotProject | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const project = data as CopilotProjectResponse;

  if (!project.uuid) {
    return null;
  }

  return {
    name: String(project.name ?? ''),
    assignedAgents: Number(project.assigned_agents ?? 0),
    createdOn: String(project.created_on ?? ''),
    connectedOn: String(project.connected_on ?? ''),
    uuid: String(project.uuid),
    projectUuid: project.project_uuid
      ? String(project.project_uuid)
      : undefined,
    connectedBy: String(project.connected_by ?? project.connect_by ?? ''),
    isConnected: project.is_connected !== false,
    disconnectedBy: project.disconnect_by
      ? String(project.disconnect_by)
      : undefined,
    disconnectedOn: project.disconnect_on
      ? String(project.disconnect_on)
      : undefined,
  };
}

export default {
  async getLinkedProject(projectUuid: string): Promise<CopilotProject | null> {
    if (IS_MOCKED) {
      return MOCKED_COPILOT_PROJECT;
    }

    const response = await http.get<CopilotProjectResponse | null>(
      `/project/copilot/linked_project/${projectUuid}`,
    );
    return normalizeCopilotProject(response.data);
  },

  async create(name: string, projectUuid: string): Promise<CopilotProject> {
    const response = await http.post<CopilotProjectResponse>(
      '/project/copilot/create',
      { name, project: projectUuid },
    );
    const project = IS_MOCKED
      ? MOCKED_COPILOT_PROJECT
      : normalizeCopilotProject(response.data);

    if (!project) {
      throw new Error('Invalid copilot project response');
    }

    return project;
  },

  async reconnect(copilotProjectUuid: string): Promise<CopilotProject> {
    if (IS_MOCKED) {
      return { ...MOCKED_COPILOT_PROJECT, isConnected: true };
    }

    const response = await http.put<CopilotProjectResponse>(
      `/project/copilot/update/${copilotProjectUuid}`,
      { is_connected: true },
    );
    const project = normalizeCopilotProject(response.data);

    if (!project) {
      throw new Error('Invalid copilot project response');
    }

    return { ...project, isConnected: true };
  },

  async remove(copilotProjectUuid: string): Promise<void> {
    if (IS_MOCKED) {
      return;
    }

    await http.delete(`/project/copilot/remove/${copilotProjectUuid}`);
  },

  async canCreate(projectUuid: string): Promise<boolean> {
    if (IS_MOCKED) {
      return true;
    }

    const response = await http.get<{ can_create?: boolean }>(
      `/project/copilot/can_create/${projectUuid}`,
    );

    return response.data?.can_create === true;
  },
};
