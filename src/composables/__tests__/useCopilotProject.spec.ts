import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import {
  resetCopilotProjectState,
  useCopilotProject,
} from '../useCopilotProject';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    getLinkedProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listExistingProjects: vi.fn(),
  },
}));

const linkedProject = {
  name: 'Sales 123',
  assignedAgents: 3,
  createdOn: '2026-07-30T00:00:00Z',
  connectedOn: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connectedBy: 'edu',
};

describe('useCopilotProject', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetCopilotProjectState();
    vi.clearAllMocks();

    const configStore = useConfig();
    configStore.project = {
      uuid: 'desk-uuid',
      name: 'Sales 123',
      config: {},
      org: 'org-uuid',
    };
  });

  it('starts without a linked project and shows the new badge', () => {
    const {
      linkedProject: project,
      showNewBadge,
      isLinked,
    } = useCopilotProject();

    expect(project.value).toBeNull();
    expect(showNewBadge.value).toBe(true);
    expect(isLinked.value).toBe(false);
  });

  it('loads the linked project', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);

    const {
      fetchLinkedProject,
      linkedProject: project,
      showNewBadge,
    } = useCopilotProject();

    await fetchLinkedProject(true);

    expect(CopilotProjectService.getLinkedProject).toHaveBeenCalledWith(
      'desk-uuid',
    );
    expect(project.value).toEqual(linkedProject);
    expect(showNewBadge.value).toBe(false);
  });

  it('treats a missing project as empty state', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);

    const {
      fetchLinkedProject,
      linkedProject: project,
      showNewBadge,
    } = useCopilotProject();

    await fetchLinkedProject(true);

    expect(project.value).toBeNull();
    expect(showNewBadge.value).toBe(true);
  });

  it('treats a request error as empty state', async () => {
    CopilotProjectService.getLinkedProject.mockRejectedValue(
      new Error('network'),
    );

    const {
      fetchLinkedProject,
      linkedProject: project,
      isLoading,
    } = useCopilotProject();

    await fetchLinkedProject(true);

    expect(project.value).toBeNull();
    expect(isLoading.value).toBe(false);
  });

  it('updates the linked project after creation', () => {
    const {
      setLinkedProject,
      linkedProject: project,
      showNewBadge,
    } = useCopilotProject();

    setLinkedProject(linkedProject);

    expect(project.value).toEqual(linkedProject);
    expect(showNewBadge.value).toBe(false);
  });

  it('changes the linked project', async () => {
    const updatedProject = { ...linkedProject, uuid: 'copilot-uuid-2' };
    CopilotProjectService.update.mockResolvedValue(updatedProject);

    const { changeLinkedProject, linkedProject: project } = useCopilotProject();

    const result = await changeLinkedProject('copilot-uuid-2');

    expect(CopilotProjectService.update).toHaveBeenCalledWith(
      'desk-uuid',
      'copilot-uuid-2',
    );
    expect(result).toEqual(updatedProject);
    expect(project.value).toEqual(updatedProject);
  });

  it('rethrows when changing the linked project fails', async () => {
    CopilotProjectService.update.mockRejectedValue(new Error('network'));

    const { changeLinkedProject, linkedProject: project } = useCopilotProject();

    await expect(changeLinkedProject('copilot-uuid-2')).rejects.toThrow(
      'network',
    );
    expect(project.value).toBeNull();
  });
});
