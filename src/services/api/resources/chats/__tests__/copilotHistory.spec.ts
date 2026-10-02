import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'project-1'),
}));

import CopilotHistory from '../copilotHistory';
import http from '@/services/api/http';

describe('CopilotHistory service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches messages for a room with project param', async () => {
    const payload = {
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          contact: null,
          urn: 'room-1',
          channel: null,
          direction: 'out',
          text: 'Hello',
          created_on: '2024-01-01T00:00:00Z',
        },
      ],
    };
    http.get.mockResolvedValue({ data: payload });

    const response = await CopilotHistory.getMessages({ roomUuid: 'room-1' });

    expect(http.get).toHaveBeenCalledWith('/room/room-1/copilot/messages/', {
      params: { project: 'project-1' },
    });
    expect(response).toEqual(payload);
  });

  it('forwards cursor when provided', async () => {
    http.get.mockResolvedValue({
      data: { next: null, previous: null, results: [] },
    });

    await CopilotHistory.getMessages({
      roomUuid: 'room-1',
      cursor: 'cursor-abc',
    });

    expect(http.get).toHaveBeenCalledWith('/room/room-1/copilot/messages/', {
      params: { project: 'project-1', cursor: 'cursor-abc' },
    });
  });
});
