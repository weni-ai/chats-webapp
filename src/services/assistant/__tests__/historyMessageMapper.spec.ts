import { describe, it, expect } from 'vitest';

import { mapHistoryMessage } from '../historyMessageMapper';
import type { RawHistoryMessage } from '@/services/api/resources/chats/copilotHistory';

function raw(
  overrides: Partial<RawHistoryMessage> & Pick<RawHistoryMessage, 'text'>,
): RawHistoryMessage {
  return {
    id: overrides.id ?? 1,
    contact: overrides.contact ?? null,
    urn: overrides.urn ?? 'room-1',
    channel: overrides.channel ?? null,
    direction: overrides.direction ?? 'out',
    text: overrides.text,
    created_on: overrides.created_on ?? '2024-01-01T12:00:00Z',
  };
}

describe('mapHistoryMessage', () => {
  it('maps plain text out as ai and in as human', () => {
    expect(
      mapHistoryMessage(raw({ text: 'Hi', direction: 'out' })).direction,
    ).toBe('ai');
    expect(
      mapHistoryMessage(raw({ text: 'Hello', direction: 'in' })).direction,
    ).toBe('human');
  });

  it('maps plain text fields', () => {
    const mapped = mapHistoryMessage(
      raw({ id: 42, text: 'Suggested reply', direction: 'out' }),
    );

    expect(mapped).toMatchObject({
      id: '42',
      type: 'text',
      text: 'Suggested reply',
      direction: 'ai',
      quickReplies: [],
      status: 'delivered',
    });
    expect(mapped.timestamp).toBe(new Date('2024-01-01T12:00:00Z').getTime());
  });

  it('parses JSON service payloads and reuses mapServiceMessage', () => {
    const payload = {
      type: 'text',
      text: 'Intro',
      metadata: { suggestion: 'Reply to customer' },
      product_carousel: {
        text: 'Products',
        product_items: [
          {
            product_retailer_id: 'sku-1',
            name: 'Tile',
            price: '10.00',
            image: 'https://img/tile.png',
          },
        ],
      },
    };

    const mapped = mapHistoryMessage(
      raw({ text: JSON.stringify(payload), direction: 'out' }),
    );

    expect(mapped.direction).toBe('ai');
    expect(mapped.suggestion).toBe('Reply to customer');
    expect(mapped.productCarousel?.items).toHaveLength(1);
    expect(mapped.productCarousel?.items[0].product_retailer_id).toBe('sku-1');
  });

  it('maps in JSON payloads as human (agent → Copilot)', () => {
    const mapped = mapHistoryMessage(
      raw({
        text: JSON.stringify({ type: 'text', text: 'Ask about tiles' }),
        direction: 'in',
      }),
    );

    expect(mapped.direction).toBe('human');
    expect(mapped.text).toBe('Ask about tiles');
  });

  it('falls back to plain text when JSON is not a service payload', () => {
    const mapped = mapHistoryMessage(
      raw({ text: JSON.stringify(['not', 'a', 'message']), direction: 'out' }),
    );

    expect(mapped.type).toBe('text');
    expect(mapped.text).toBe(JSON.stringify(['not', 'a', 'message']));
    expect(mapped.productCarousel).toBeUndefined();
  });
});
