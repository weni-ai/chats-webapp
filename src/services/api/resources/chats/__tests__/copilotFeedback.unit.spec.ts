import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api/http', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
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

  it('lists room feedbacks to hydrate thumbs', async () => {
    http.get.mockResolvedValue({
      data: {
        results: [
          { message_id: 'msg-1', liked: true, text: '', tags: [] },
          {
            message_id: 'msg-2',
            liked: false,
            text: '',
            tags: ['slow_to_load'],
          },
        ],
      },
    });

    const result = await CopilotFeedback.getRoomFeedbacks({
      roomUuid: 'room-1',
    });

    expect(http.get).toHaveBeenCalledWith('/room/room-1/copilot/feedback/');
    expect(result).toEqual([
      { message_id: 'msg-1', liked: true, text: '', tags: [] },
      {
        message_id: 'msg-2',
        liked: false,
        text: '',
        tags: ['slow_to_load'],
      },
    ]);
  });

  it('returns an empty list when room feedback is not found', async () => {
    http.get.mockRejectedValue({ response: { status: 404 } });

    await expect(
      CopilotFeedback.getRoomFeedbacks({ roomUuid: 'room-1' }),
    ).resolves.toEqual([]);
  });

  it('gets feedback for a single message', async () => {
    http.get.mockResolvedValue({
      data: {
        uuid: 'fb-uuid',
        room: 'room-1',
        message_id: 'msg-1',
        liked: true,
        text: '',
        tags: [],
      },
    });

    const result = await CopilotFeedback.getMessageFeedback({
      roomUuid: 'room-1',
      messageId: 'msg-1',
    });

    expect(http.get).toHaveBeenCalledWith('/room/room-1/copilot/feedback/', {
      params: { message_id: 'msg-1' },
    });
    expect(result).toEqual({
      uuid: 'fb-uuid',
      room: 'room-1',
      message_id: 'msg-1',
      liked: true,
      text: '',
      tags: [],
    });
  });

  it('returns null when message feedback is not found', async () => {
    http.get.mockRejectedValue({ response: { status: 404 } });

    await expect(
      CopilotFeedback.getMessageFeedback({
        roomUuid: 'room-1',
        messageId: 'msg-1',
      }),
    ).resolves.toBeNull();
  });
});
