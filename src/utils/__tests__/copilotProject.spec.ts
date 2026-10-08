import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/utils/env', () => ({
  default: vi.fn(),
}));

import env from '@/utils/env';
import {
  buildCopilotConversationsUrl,
  buildCopilotProjectUrl,
  buildProjectCopilotSettingsUrl,
} from '../copilotProject';

describe('buildCopilotProjectUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the project URL from MODULE_FEDERATION_CONNECT_URL', () => {
    env.mockReturnValue('https://dash.stg.cloud.weni.ai');

    expect(buildCopilotProjectUrl('copilot-uuid')).toBe(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid',
    );
    expect(env).toHaveBeenCalledWith('MODULE_FEDERATION_CONNECT_URL');
  });

  it('strips a trailing slash from the connect URL', () => {
    env.mockReturnValue('https://dash.stg.cloud.weni.ai/');

    expect(buildCopilotProjectUrl('copilot-uuid')).toBe(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid',
    );
  });
});

describe('buildProjectCopilotSettingsUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the chats copilot settings URL for a project', () => {
    env.mockReturnValue('https://dash.stg.cloud.weni.ai');

    expect(buildProjectCopilotSettingsUrl('secondary-uuid')).toBe(
      'https://dash.stg.cloud.weni.ai/projects/secondary-uuid/settings/chats?tab=desk_copilot',
    );
  });

  it('strips a trailing slash from the connect URL', () => {
    env.mockReturnValue('https://dash.stg.cloud.weni.ai/');

    expect(buildProjectCopilotSettingsUrl('secondary-uuid')).toBe(
      'https://dash.stg.cloud.weni.ai/projects/secondary-uuid/settings/chats?tab=desk_copilot',
    );
  });
});

describe('buildCopilotConversationsUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the AI Conversations URL with search and date range', () => {
    env.mockReturnValue('https://dash.weni.ai');

    expect(
      buildCopilotConversationsUrl({
        projectUuid: 'copilot-project',
        roomUuid: 'room-1',
        start: '2026-02-01',
        end: '2026-02-11',
      }),
    ).toBe(
      'https://dash.weni.ai/projects/copilot-project/ai-conversations/conversations?search=room-1&start=2026-02-01&end=2026-02-11',
    );
    expect(env).toHaveBeenCalledWith('MODULE_FEDERATION_CONNECT_URL');
  });

  it('strips a trailing slash from the connect URL', () => {
    env.mockReturnValue('https://dash.weni.ai/');

    expect(
      buildCopilotConversationsUrl({
        projectUuid: 'copilot-project',
        roomUuid: 'room-1',
      }),
    ).toBe(
      'https://dash.weni.ai/projects/copilot-project/ai-conversations/conversations?search=room-1',
    );
  });

  it('omits empty query values', () => {
    env.mockReturnValue('https://dash.weni.ai');

    expect(
      buildCopilotConversationsUrl({
        projectUuid: 'copilot-project',
      }),
    ).toBe(
      'https://dash.weni.ai/projects/copilot-project/ai-conversations/conversations',
    );
  });
});
