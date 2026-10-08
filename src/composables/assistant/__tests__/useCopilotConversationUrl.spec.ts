import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import moment from 'moment';

import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import {
  resetCopilotConversationUrlState,
  useCopilotConversationUrl,
} from '../useCopilotConversationUrl';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    getLinkedProject: vi.fn(),
  },
}));

vi.mock('@/utils/env', () => ({
  default: vi.fn(() => 'https://dash.weni.ai'),
}));

const linkedProject = {
  name: 'Desk Copilot',
  assignedAgents: 1,
  createdOn: '2026-02-01T00:00:00Z',
  connectedOn: '2026-02-01T00:00:00Z',
  uuid: 'copilot-uuid',
  projectUuid: 'copilot-project',
  connectedBy: 'agent@example.com',
  isConnected: true,
};

describe('useCopilotConversationUrl', () => {
  beforeEach(() => {
    resetCopilotConversationUrlState();
    vi.clearAllMocks();
  });

  it('builds the conversations URL with search and date range', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);

    const originProjectUuid = ref('origin-project');
    const room = ref({
      uuid: 'room-1',
      created_on: '2026-02-01T12:00:00Z',
      ended_at: '2026-02-11T15:00:00Z',
    });

    const { url, isLoading } = useCopilotConversationUrl(
      originProjectUuid,
      room,
      true,
    );

    expect(isLoading.value).toBe(true);
    expect(url.value).toBeUndefined();

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(CopilotProjectService.getLinkedProject).toHaveBeenCalledWith(
      'origin-project',
    );
    expect(url.value).toBe(
      'https://dash.weni.ai/projects/copilot-project/ai-conversations/conversations?search=room-1&start=2026-02-01&end=2026-02-11',
    );
  });

  it('falls back to the linked project uuid when projectUuid is missing', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue({
      ...linkedProject,
      projectUuid: undefined,
    });

    const { url, isLoading } = useCopilotConversationUrl(
      'origin-project',
      { uuid: 'room-1', created_on: '2026-02-01T00:00:00Z' },
      true,
    );

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(url.value).toContain('/projects/copilot-uuid/ai-conversations/');
  });

  it('uses today as end when the room has no ended_at', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);

    const { url, isLoading } = useCopilotConversationUrl(
      'origin-project',
      {
        uuid: 'room-1',
        created_on: '2026-02-01T12:00:00Z',
      },
      true,
    );

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(url.value).toBe(
      `https://dash.weni.ai/projects/copilot-project/ai-conversations/conversations?search=room-1&start=2026-02-01&end=${moment().format('YYYY-MM-DD')}`,
    );
  });

  it('does not fetch when disabled and keeps the url empty', async () => {
    const { url, isLoading } = useCopilotConversationUrl(
      'origin-project',
      { uuid: 'room-1' },
      false,
    );

    await nextTick();

    expect(CopilotProjectService.getLinkedProject).not.toHaveBeenCalled();
    expect(isLoading.value).toBe(false);
    expect(url.value).toBeUndefined();
  });

  it('returns no url when the linked project lookup fails', async () => {
    CopilotProjectService.getLinkedProject.mockRejectedValue(
      new Error('forbidden'),
    );

    const { url, isLoading } = useCopilotConversationUrl(
      'origin-project',
      { uuid: 'room-1' },
      true,
    );

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(url.value).toBeUndefined();
  });

  it('returns no url when there is no linked project', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);

    const { url, isLoading } = useCopilotConversationUrl(
      'origin-project',
      { uuid: 'room-1' },
      true,
    );

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(url.value).toBeUndefined();
  });

  it('caches the linked project lookup by origin uuid', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);

    const first = useCopilotConversationUrl(
      'origin-project',
      { uuid: 'room-1', created_on: '2026-02-01T00:00:00Z' },
      true,
    );
    await vi.waitFor(() => expect(first.isLoading.value).toBe(false));

    const second = useCopilotConversationUrl(
      'origin-project',
      { uuid: 'room-2', created_on: '2026-02-01T00:00:00Z' },
      true,
    );
    await vi.waitFor(() => expect(second.isLoading.value).toBe(false));

    expect(CopilotProjectService.getLinkedProject).toHaveBeenCalledTimes(1);
    expect(second.url.value).toContain('search=room-2');
  });
});
