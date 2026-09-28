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
    canCreate: vi.fn(),
    create: vi.fn(),
    reconnect: vi.fn(),
    remove: vi.fn(),
  },
}));

const linkedProject = {
  name: 'Sales 123',
  assignedAgents: 3,
  createdOn: '2026-07-30T00:00:00Z',
  connectedOn: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  projectUuid: 'desk-uuid',
  connectedBy: 'edu',
  isConnected: true,
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
      isConnected,
    } = useCopilotProject();

    expect(project.value).toBeNull();
    expect(showNewBadge.value).toBe(true);
    expect(isLinked.value).toBe(false);
    expect(isConnected.value).toBe(false);
  });

  it('loads the linked project', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);

    const {
      fetchLinkedProject,
      linkedProject: project,
      showNewBadge,
      isConnected,
    } = useCopilotProject();

    await fetchLinkedProject(true);

    expect(CopilotProjectService.getLinkedProject).toHaveBeenCalledWith(
      'desk-uuid',
    );
    expect(project.value).toEqual(linkedProject);
    expect(showNewBadge.value).toBe(false);
    expect(isConnected.value).toBe(true);
  });

  it('shows the new badge when the linked project is disconnected', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue({
      ...linkedProject,
      isConnected: false,
    });

    const { fetchLinkedProject, showNewBadge, isConnected } =
      useCopilotProject();

    await fetchLinkedProject(true);

    expect(isConnected.value).toBe(false);
    expect(showNewBadge.value).toBe(true);
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

  it('reconnects the linked project and keeps projectUuid', async () => {
    const reconnectResponse = {
      name: 'Sales 123',
      assignedAgents: 3,
      createdOn: '2026-07-30T00:00:00Z',
      connectedOn: '2026-09-28T00:00:00Z',
      uuid: 'copilot-uuid',
      connectedBy: 'edu',
      isConnected: true,
    };
    CopilotProjectService.reconnect.mockResolvedValue(reconnectResponse);

    const {
      setLinkedProject,
      reconnectLinkedProject,
      linkedProject: project,
    } = useCopilotProject();
    setLinkedProject({
      ...linkedProject,
      isConnected: false,
      disconnectedBy: 'ana',
      disconnectedOn: '2026-09-10T00:00:00Z',
    });

    const result = await reconnectLinkedProject();

    expect(CopilotProjectService.reconnect).toHaveBeenCalledWith(
      'copilot-uuid',
    );
    expect(result.isConnected).toBe(true);
    expect(result.projectUuid).toBe('desk-uuid');
    expect(project.value?.connectedOn).toBe('2026-09-28T00:00:00Z');
  });

  it('rethrows when reconnecting fails and keeps the disconnected project', async () => {
    CopilotProjectService.reconnect.mockRejectedValue(new Error('network'));

    const disconnected = { ...linkedProject, isConnected: false };
    const {
      setLinkedProject,
      reconnectLinkedProject,
      linkedProject: project,
    } = useCopilotProject();
    setLinkedProject(disconnected);

    await expect(reconnectLinkedProject()).rejects.toThrow('network');
    expect(project.value).toEqual(disconnected);
  });

  it('keeps the project as disconnected after a successful disconnect', async () => {
    CopilotProjectService.remove.mockResolvedValue();
    CopilotProjectService.getLinkedProject.mockResolvedValue({
      ...linkedProject,
      isConnected: false,
      disconnectedBy: 'edu',
      disconnectedOn: '2026-09-10T00:00:00Z',
    });

    const {
      setLinkedProject,
      disconnectLinkedProject,
      linkedProject: project,
    } = useCopilotProject();
    setLinkedProject(linkedProject);

    await disconnectLinkedProject();

    expect(CopilotProjectService.remove).toHaveBeenCalledWith('copilot-uuid');
    expect(project.value?.isConnected).toBe(false);
    expect(project.value?.disconnectedBy).toBe('edu');
    expect(project.value?.uuid).toBe('copilot-uuid');
  });

  it('falls back to a local disconnected project when refetch returns nothing', async () => {
    CopilotProjectService.remove.mockResolvedValue();
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);

    const {
      setLinkedProject,
      disconnectLinkedProject,
      linkedProject: project,
    } = useCopilotProject();
    setLinkedProject(linkedProject);

    await disconnectLinkedProject();

    expect(project.value?.uuid).toBe('copilot-uuid');
    expect(project.value?.isConnected).toBe(false);
    expect(project.value?.disconnectedOn).toBeTruthy();
  });

  it('keeps the linked project when disconnect fails', async () => {
    CopilotProjectService.remove.mockRejectedValue(new Error('network'));

    const {
      setLinkedProject,
      disconnectLinkedProject,
      linkedProject: project,
    } = useCopilotProject();
    setLinkedProject(linkedProject);

    await expect(disconnectLinkedProject()).rejects.toThrow('network');
    expect(project.value).toEqual(linkedProject);
  });

  it('loads canCreate and enables creation when allowed', async () => {
    CopilotProjectService.canCreate.mockResolvedValue(true);

    const { fetchCanCreate, canCreateProject, isCreateDisabled } =
      useCopilotProject();

    expect(isCreateDisabled.value).toBe(true);

    await fetchCanCreate(true);

    expect(CopilotProjectService.canCreate).toHaveBeenCalledWith('desk-uuid');
    expect(canCreateProject.value).toBe(true);
    expect(isCreateDisabled.value).toBe(false);
  });

  it('disables creation when canCreate is false', async () => {
    CopilotProjectService.canCreate.mockResolvedValue(false);

    const { fetchCanCreate, canCreateProject, isCreateDisabled } =
      useCopilotProject();

    await fetchCanCreate(true);

    expect(canCreateProject.value).toBe(false);
    expect(isCreateDisabled.value).toBe(true);
  });

  it('disables creation when canCreate request fails', async () => {
    CopilotProjectService.canCreate.mockRejectedValue(new Error('network'));

    const { fetchCanCreate, canCreateProject, isCreateDisabled } =
      useCopilotProject();

    await fetchCanCreate(true);

    expect(canCreateProject.value).toBe(false);
    expect(isCreateDisabled.value).toBe(true);
  });
});
