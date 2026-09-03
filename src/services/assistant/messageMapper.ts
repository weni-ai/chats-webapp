import type { Message, ProductCarouselItem } from '@weni/webchat-service';
import type { AssistantMessage, AssistantMessageType } from './types';

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

function normalizeMessageType(type?: string): AssistantMessageType {
  switch (type) {
    case 'audio':
    case 'image':
    case 'video':
    case 'file':
    case 'document':
      return type === 'document' ? 'file' : type;
    case 'order':
      return 'order';
    default:
      return 'text';
  }
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeProductCarouselItems(
  items?: ProductCarouselItem[],
): ProductCarouselItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) =>
      item &&
      typeof item.product_retailer_id === 'string' &&
      item.product_retailer_id.trim() &&
      typeof item.name === 'string' &&
      item.name.trim(),
  );
}

export function mapServiceMessage(message: Message): AssistantMessage {
  const metadata = message.metadata || {};
  const suggestion = asOptionalString(metadata.suggestion);
  const filename =
    asOptionalString(metadata.filename) ||
    asOptionalString((metadata as { file_name?: string }).file_name);
  const mimeType =
    asOptionalString(metadata.mimeType) ||
    asOptionalString((metadata as { mime_type?: string }).mime_type);
  const size =
    asOptionalNumber(metadata.size) ||
    asOptionalNumber((metadata as { file_size?: number }).file_size);
  const duration = asOptionalNumber(metadata.duration);

  const productItems = normalizeProductCarouselItems(
    message.product_carousel?.product_items,
  );
  const productCarouselText =
    asOptionalString(message.product_carousel?.text) ||
    asOptionalString(message.text) ||
    '';

  return {
    id: message.id,
    direction: message.direction === 'outgoing' ? 'human' : 'ai',
    type: normalizeMessageType(message.type),
    text: message.text || '',
    media: asOptionalString(message.media),
    filename,
    mimeType,
    size,
    duration,
    suggestion,
    quickReplies: normalizeQuickReplies(message.quick_replies),
    status: message.status || '',
    timestamp: message.timestamp || Date.now(),
    productCarousel:
      productItems.length > 0
        ? {
            text: productCarouselText,
            items: productItems,
          }
        : undefined,
  };
}
