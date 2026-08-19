import http from '@/services/api/http';

export type CopilotProject = {
  name: string;
  assignedAgents: number;
  createdOn: string;
  connectedOn: string;
  uuid: string;
  projectUuid?: string;
  connectedBy?: string;
};

export type CopilotProjectSummary = {
  name: string;
  assignedAgents: number;
  uuid: string;
  projectUuid?: string;
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

const IS_MOCKED = true;

const MOCKED_COPILOT_PROJECT: CopilotProject = {
  name: 'Desk Copilot',
  assignedAgents: 0,
  createdOn: new Date().toISOString(),
  connectedOn: new Date().toISOString(),
  uuid: '1234567890',
  projectUuid: 'project-1234567890',
  connectedBy: 'test@example.com',
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
  };
}

export function normalizeCopilotProjectSummary(
  data: unknown,
): CopilotProjectSummary | null {
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
    uuid: String(project.uuid),
    projectUuid: project.project_uuid
      ? String(project.project_uuid)
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

  async listExistingProjects(
    orgUuid: string,
  ): Promise<CopilotProjectSummary[]> {
    if (IS_MOCKED) {
      return [
        {
          name: MOCKED_COPILOT_PROJECT.name,
          assignedAgents: MOCKED_COPILOT_PROJECT.assignedAgents,
          uuid: MOCKED_COPILOT_PROJECT.uuid,
          projectUuid: MOCKED_COPILOT_PROJECT.projectUuid,
        },
      ];
    }

    const response = await http.get<CopilotProjectResponse[]>(
      `/project/copilot/list_existing_projects/${orgUuid}`,
    );

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map(normalizeCopilotProjectSummary)
      .filter((project): project is CopilotProjectSummary => project !== null);
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

  async update(
    currentProjectUuid: string,
    newCopilotProjectUuid: string,
  ): Promise<CopilotProject> {
    if (IS_MOCKED) {
      return MOCKED_COPILOT_PROJECT;
    }

    const response = await http.put<CopilotProjectResponse>(
      `/project/copilot/update/${currentProjectUuid}`,
      { new_uuid: newCopilotProjectUuid },
    );
    const project = normalizeCopilotProject(response.data);

    if (!project) {
      throw new Error('Invalid copilot project response');
    }

    return project;
  },

  async remove(copilotProjectUuid: string): Promise<void> {
    if (IS_MOCKED) {
      return;
    }

    await http.delete(`/project/copilot/remove/${copilotProjectUuid}`);
  },
};
