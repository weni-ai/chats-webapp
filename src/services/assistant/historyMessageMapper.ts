import type { Message } from '@weni/webchat-service';
import { mapServiceMessage } from './messageMapper';
import type { AssistantMessage } from './types';
import type { RawHistoryMessage } from '@/services/api/resources/chats/copilotHistory';

function isValidJson(message: string): boolean {
  try {
    const parsedObject = JSON.parse(message);
    return typeof parsedObject === 'object' && parsedObject !== null;
  } catch {
    return false;
  }
}

function isServiceMessagePayload(value: unknown): value is Partial<Message> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.type === 'string' ||
    typeof payload.text === 'string' ||
    Array.isArray(payload.product_carousel) ||
    typeof payload.product_carousel === 'object' ||
    typeof payload.product_list === 'object' ||
    typeof payload.metadata === 'object'
  );
}

/**
 * Maps a raw history API message into an AssistantMessage.
 *
 * Direction mapping for the internals contract:
 * - `in`  = agent → Copilot  → human bubble (`outgoing` for mapServiceMessage)
 * - `out` = Copilot → agent  → ai bubble (`incoming` for mapServiceMessage)
 */
export function mapHistoryMessage(raw: RawHistoryMessage): AssistantMessage {
  const timestamp = raw.created_on
    ? new Date(raw.created_on).getTime()
    : Date.now();
  const serviceDirection = raw.direction === 'in' ? 'outgoing' : 'incoming';

  if (raw.text && isValidJson(raw.text)) {
    try {
      const parsed = JSON.parse(raw.text);
      if (isServiceMessagePayload(parsed)) {
        return mapServiceMessage({
          id: String(raw.id),
          type: typeof parsed.type === 'string' ? parsed.type : 'text',
          text: typeof parsed.text === 'string' ? parsed.text : '',
          media: typeof parsed.media === 'string' ? parsed.media : undefined,
          timestamp:
            typeof parsed.timestamp === 'number' ? parsed.timestamp : timestamp,
          direction: serviceDirection,
          status:
            typeof parsed.status === 'string' ? parsed.status : 'delivered',
          quick_replies: parsed.quick_replies,
          metadata: parsed.metadata,
          product_carousel: parsed.product_carousel,
          product_list: parsed.product_list,
          header: parsed.header,
          order: parsed.order,
        } as Message);
      }
    } catch {
      // Fall through to plain-text mapping.
    }
  }

  return {
    id: String(raw.id),
    direction: raw.direction === 'in' ? 'human' : 'ai',
    type: 'text',
    text: raw.text || '',
    quickReplies: [],
    status: 'delivered',
    timestamp,
  };
}
