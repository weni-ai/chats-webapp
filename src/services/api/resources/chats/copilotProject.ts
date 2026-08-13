import http from '@/services/api/http';

export type CopilotProject = {
  name: string;
  assigned_agents: number;
  created_on: string;
  connected_on: string;
  uuid: string;
  project_uuid?: string;
  connected_by?: string;
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
    assigned_agents: Number(project.assigned_agents ?? 0),
    created_on: String(project.created_on ?? ''),
    connected_on: String(project.connected_on ?? ''),
    uuid: String(project.uuid),
    project_uuid: project.project_uuid
      ? String(project.project_uuid)
      : undefined,
    connected_by: String(project.connected_by ?? project.connect_by ?? ''),
  };
}

export default {
  async getLinkedProject(projectUuid: string): Promise<CopilotProject | null> {
    const response = await http.get<CopilotProjectResponse | null>(
      `/project/copilot/linked_project/${projectUuid}`,
    );
    return normalizeCopilotProject(response.data);
  },

  async create(name: string): Promise<CopilotProject> {
    const response = await http.post<CopilotProjectResponse>(
      '/project/copilot/create',
      { name },
    );
    const project = normalizeCopilotProject(response.data);

    if (!project) {
      throw new Error('Invalid copilot project response');
    }

    return project;
  },
};
