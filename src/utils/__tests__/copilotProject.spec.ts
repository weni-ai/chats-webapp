import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/utils/env', () => ({
  default: vi.fn(),
}));

import env from '@/utils/env';
import { buildCopilotProjectUrl } from '../copilotProject';

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
