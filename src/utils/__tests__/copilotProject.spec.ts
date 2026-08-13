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

  it('builds the dashboard project URL', () => {
    env.mockReturnValue('https://dash.stg.cloud.weni.ai');

    expect(buildCopilotProjectUrl('copilot-uuid')).toBe(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid',
    );
  });

  it('strips a trailing slash from the dashboard URL', () => {
    env.mockReturnValue('https://dash.stg.cloud.weni.ai/');

    expect(buildCopilotProjectUrl('copilot-uuid')).toBe(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid',
    );
  });
});
