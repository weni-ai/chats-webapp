import type { Message } from '@weni/webchat-service';
import type { AssistantMessage } from './types';

type QuickReplyEntry = string | { title?: string; text?: string };

function normalizeQuickReplies(
  quickReplies?: Message['quick_replies'],
): string[] {
  if (!Array.isArray(quickReplies)) {
    return [];
  }

  return quickReplies
    .map((entry: QuickReplyEntry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }

      if (entry && typeof entry === 'object') {
        const value = entry.title || entry.text || '';
        return String(value).trim();
      }

      return '';
    })
    .filter(Boolean);
}

export function mapServiceMessage(message: Message): AssistantMessage {
  const metadata = message.metadata || {};
  const suggestion =
    typeof metadata.suggestion === 'string' && metadata.suggestion.trim()
      ? metadata.suggestion.trim()
      : undefined;

  return {
    id: message.id,
    direction: message.direction === 'outgoing' ? 'human' : 'ai',
    text: message.text || '',
    suggestion,
    quickReplies: normalizeQuickReplies(message.quick_replies),
    status: message.status || '',
    timestamp: message.timestamp || Date.now(),
  };
}
