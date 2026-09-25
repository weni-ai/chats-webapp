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
  CopilotMessageFeedbackTag,
  COPILOT_MESSAGE_FEEDBACK_TAG_KEYS,
  normalizeFeedbackTags,
} from '../copilotFeedback';
import http from '@/services/api/http';

describe('CopilotFeedback service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes the tag enum values as a string list', () => {
    expect(COPILOT_MESSAGE_FEEDBACK_TAG_KEYS).toEqual([
      CopilotMessageFeedbackTag.IncorrectAnswer,
      CopilotMessageFeedbackTag.IncompleteAnswer,
      CopilotMessageFeedbackTag.ConfusingAnswer,
      CopilotMessageFeedbackTag.NoItemsFound,
      CopilotMessageFeedbackTag.OutOfContextItems,
      CopilotMessageFeedbackTag.DidNotLoad,
      CopilotMessageFeedbackTag.SlowToLoad,
      CopilotMessageFeedbackTag.UnclearInterface,
    ]);
    expect(CopilotFeedback.getMessageFeedbackTags()).toEqual(
      COPILOT_MESSAGE_FEEDBACK_TAG_KEYS.map((key) => ({
        key,
        name: `contact_info.desk_copilot.feedback.message_tags.${key}`,
      })),
    );
  });

  it('keeps only known enum values in tags', () => {
    expect(
      normalizeFeedbackTags([
        CopilotMessageFeedbackTag.IncorrectAnswer,
        'Incorrect answer',
        'unknown_tag',
        CopilotMessageFeedbackTag.DidNotLoad,
      ]),
    ).toEqual([
      CopilotMessageFeedbackTag.IncorrectAnswer,
      CopilotMessageFeedbackTag.DidNotLoad,
    ]);
  });

  it('posts message feedback with enum tags, never translated labels', async () => {
    http.post.mockResolvedValue({ data: { ok: true } });

    const result = await CopilotFeedback.sendMessageFeedback({
      roomUuid: 'room-1',
      messageId: 'msg-1',
      liked: false,
      text: 'Needs work',
      tags: [
        CopilotMessageFeedbackTag.IncorrectAnswer,
        'Resposta incorreta',
        CopilotMessageFeedbackTag.OutOfContextItems,
      ],
    });

    expect(http.post).toHaveBeenCalledWith('/room/room-1/copilot/feedback/', {
      message_id: 'msg-1',
      liked: false,
      text: 'Needs work',
      tags: [
        CopilotMessageFeedbackTag.IncorrectAnswer,
        CopilotMessageFeedbackTag.OutOfContextItems,
      ],
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
