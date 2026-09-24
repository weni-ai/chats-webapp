import http from '@/services/api/http';
import i18n from '@/plugins/i18n';

export const COPILOT_MESSAGE_FEEDBACK_TAG_KEYS = [
  'incorrect_answer',
  'incomplete_answer',
  'confusing_answer',
  'no_items_found',
  'out_of_context_items',
  'did_not_load',
  'slow_to_load',
  'unclear_interface',
] as const;

export type CopilotMessageFeedbackTagKey =
  (typeof COPILOT_MESSAGE_FEEDBACK_TAG_KEYS)[number];

export type CopilotMessageFeedbackTag = {
  uuid: CopilotMessageFeedbackTagKey;
  name: string;
};

type SendMessageFeedbackPayload = {
  roomUuid: string;
  messageId: string;
  liked: boolean;
  text?: string;
  tags?: string[];
};

export default {
  getMessageFeedbackTags(): CopilotMessageFeedbackTag[] {
    return COPILOT_MESSAGE_FEEDBACK_TAG_KEYS.map((key) => ({
      uuid: key,
      name: i18n.global.t(
        `contact_info.desk_copilot.feedback.message_tags.${key}`,
      ),
    }));
  },

  async sendMessageFeedback({
    roomUuid,
    messageId,
    liked,
    text = '',
    tags = [],
  }: SendMessageFeedbackPayload) {
    const response = await http.post(`/room/${roomUuid}/copilot/feedback/`, {
      message_id: messageId,
      liked,
      text,
      tags,
    });
    return response.data;
  },
};
