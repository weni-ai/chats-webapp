import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import {
  resetCopilotProjectsListState,
  useCopilotProjectsList,
} from '../useCopilotProjectsList';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    listExistingProjects: vi.fn(),
  },
}));

const existingProjects = [
  {
    name: 'Sales 123',
    assigned_agents: 3,
    uuid: 'copilot-uuid',
    project_uuid: 'desk-uuid',
  },
  {
    name: 'Sales 456',
    assigned_agents: 1,
    uuid: 'copilot-uuid-2',
    project_uuid: 'desk-uuid-2',
  },
];

describe('useCopilotProjectsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetCopilotProjectsListState();
    vi.clearAllMocks();

    const configStore = useConfig();
    configStore.project = {
      uuid: 'desk-uuid',
      name: 'Sales 123',
      config: {},
      org: 'org-uuid',
    };
  });

  it('starts without projects', () => {
    const { projects, hasMultipleProjects } = useCopilotProjectsList();

    expect(projects.value).toEqual([]);
    expect(hasMultipleProjects.value).toBe(false);
  });

  it('loads existing projects and detects multiple items', async () => {
    CopilotProjectService.listExistingProjects.mockResolvedValue(
      existingProjects,
    );

    const { fetchProjects, projects, hasMultipleProjects } =
      useCopilotProjectsList();

    await fetchProjects(true);

    expect(CopilotProjectService.listExistingProjects).toHaveBeenCalledWith(
      'org-uuid',
    );
    expect(projects.value).toEqual(existingProjects);
    expect(hasMultipleProjects.value).toBe(true);
  });

  it('keeps hasMultipleProjects false for a single project', async () => {
    CopilotProjectService.listExistingProjects.mockResolvedValue([
      existingProjects[0],
    ]);

    const { fetchProjects, hasMultipleProjects } = useCopilotProjectsList();

    await fetchProjects(true);

    expect(hasMultipleProjects.value).toBe(false);
  });

  it('treats a request error as an empty list', async () => {
    CopilotProjectService.listExistingProjects.mockRejectedValue(
      new Error('network'),
    );

    const { fetchProjects, projects, isLoading } = useCopilotProjectsList();

    await fetchProjects(true);

    expect(projects.value).toEqual([]);
    expect(isLoading.value).toBe(false);
  });

  it('clears the list when the org uuid is missing', async () => {
    const configStore = useConfig();
    configStore.project = {
      uuid: 'desk-uuid',
      name: 'Sales 123',
      config: {},
    };

    const { fetchProjects, projects } = useCopilotProjectsList();

    await fetchProjects(true);

    expect(CopilotProjectService.listExistingProjects).not.toHaveBeenCalled();
    expect(projects.value).toEqual([]);
  });
});
