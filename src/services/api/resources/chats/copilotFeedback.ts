import http from '@/services/api/http';
import i18n from '@/plugins/i18n';

export enum CopilotMessageFeedbackTag {
  IncorrectAnswer = 'incorrect_answer',
  IncompleteAnswer = 'incomplete_answer',
  ConfusingAnswer = 'confusing_answer',
  NoItemsFound = 'no_items_found',
  OutOfContextItems = 'out_of_context_items',
  DidNotLoad = 'did_not_load',
  SlowToLoad = 'slow_to_load',
  UnclearInterface = 'unclear_interface',
}

export const COPILOT_MESSAGE_FEEDBACK_TAG_KEYS = Object.values(
  CopilotMessageFeedbackTag,
);

export type CopilotMessageFeedbackTagKey = CopilotMessageFeedbackTag;

export type CopilotMessageFeedbackTagItem = {
  key: CopilotMessageFeedbackTag;
  name: string;
};

type SendMessageFeedbackPayload = {
  roomUuid: string;
  messageId: string;
  liked: boolean;
  text?: string;
  tags?: string[];
};

const allowedTags = new Set<string>(COPILOT_MESSAGE_FEEDBACK_TAG_KEYS);

export function normalizeFeedbackTags(
  tags: string[] = [],
): CopilotMessageFeedbackTag[] {
  return tags.filter((tag): tag is CopilotMessageFeedbackTag =>
    allowedTags.has(tag),
  );
}

export default {
  getMessageFeedbackTags(): CopilotMessageFeedbackTagItem[] {
    return COPILOT_MESSAGE_FEEDBACK_TAG_KEYS.map((key) => ({
      key,
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
      tags: normalizeFeedbackTags(tags),
    });
    return response.data;
  },
};
