import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api/http', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/plugins/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}));

import CopilotFeedback, {
  COPILOT_MESSAGE_FEEDBACK_TAG_KEYS,
} from '../copilotFeedback';
import http from '@/services/api/http';

describe('CopilotFeedback service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the provisional i18n tag list', () => {
    expect(COPILOT_MESSAGE_FEEDBACK_TAG_KEYS).toEqual([
      'incorrect_answer',
      'incomplete_answer',
      'confusing_answer',
      'no_items_found',
      'out_of_context_items',
      'did_not_load',
      'slow_to_load',
      'unclear_interface',
    ]);
    expect(CopilotFeedback.getMessageFeedbackTags()).toEqual(
      COPILOT_MESSAGE_FEEDBACK_TAG_KEYS.map((key) => ({
        uuid: key,
        name: `contact_info.desk_copilot.feedback.message_tags.${key}`,
      })),
    );
  });

  it('posts message feedback to the provisional endpoint', async () => {
    http.post.mockResolvedValue({ data: { ok: true } });

    const result = await CopilotFeedback.sendMessageFeedback({
      roomUuid: 'room-1',
      messageId: 'msg-1',
      liked: false,
      text: 'Needs work',
      tags: ['incorrect_answer'],
    });

    expect(http.post).toHaveBeenCalledWith('/room/room-1/copilot/feedback/', {
      message_id: 'msg-1',
      liked: false,
      text: 'Needs work',
      tags: ['incorrect_answer'],
    });
    expect(result).toEqual({ ok: true });
  });

  it('sends empty text and tags by default', async () => {
    http.post.mockResolvedValue({ data: { ok: true } });

    await CopilotFeedback.sendMessageFeedback({
      roomUuid: 'room-1',
      messageId: 'msg-1',
      liked: true,
    });

    expect(http.post).toHaveBeenCalledWith('/room/room-1/copilot/feedback/', {
      message_id: 'msg-1',
      liked: true,
      text: '',
      tags: [],
    });
  });
});
