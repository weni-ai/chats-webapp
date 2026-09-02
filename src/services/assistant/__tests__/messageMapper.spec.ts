import { describe, it, expect } from 'vitest';
import { mapServiceMessage } from '../messageMapper';
import type { Message } from '@weni/webchat-service';

function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    type: 'text',
    text: 'Hello',
    timestamp: 1,
    direction: 'incoming',
    status: 'delivered',
    ...overrides,
  };
}

describe('mapServiceMessage', () => {
  it('maps outgoing messages to human and incoming to ai', () => {
    expect(
      mapServiceMessage(buildMessage({ direction: 'outgoing' })).direction,
    ).toBe('human');
    expect(
      mapServiceMessage(buildMessage({ direction: 'incoming' })).direction,
    ).toBe('ai');
  });

  it('normalizes string quick replies', () => {
    const mapped = mapServiceMessage(
      buildMessage({
        quick_replies: ['Ask about color', ' Ask about size '],
      }),
    );

    expect(mapped.quickReplies).toEqual(['Ask about color', 'Ask about size']);
  });

  it('normalizes object quick replies with title or text', () => {
    const mapped = mapServiceMessage(
      buildMessage({
        quick_replies: [
          { title: 'Color' },
          { text: 'Size' },
          { title: '' },
          '  Material  ',
        ],
      }),
    );

    expect(mapped.quickReplies).toEqual(['Color', 'Size', 'Material']);
  });

  it('extracts suggestion from metadata when present', () => {
    const mapped = mapServiceMessage(
      buildMessage({
        text: 'Intro text',
        metadata: { suggestion: 'Suggested reply' },
      }),
    );

    expect(mapped.text).toBe('Intro text');
    expect(mapped.suggestion).toBe('Suggested reply');
  });

  it('maps media message fields for audio and files', () => {
    const mapped = mapServiceMessage(
      buildMessage({
        type: 'audio',
        text: '',
        media: 'data:audio/mp3;base64,abc',
        metadata: {
          filename: 'voice.mp3',
          mimeType: 'audio/mpeg',
          size: 1234,
          duration: 2.5,
        },
      }),
    );

    expect(mapped.type).toBe('audio');
    expect(mapped.media).toBe('data:audio/mp3;base64,abc');
    expect(mapped.filename).toBe('voice.mp3');
    expect(mapped.mimeType).toBe('audio/mpeg');
    expect(mapped.size).toBe(1234);
    expect(mapped.duration).toBe(2.5);
  });

  it('maps product_carousel items when present', () => {
    const mapped = mapServiceMessage(
      buildMessage({
        text: 'Check these products',
        product_carousel: {
          text: 'Check these products',
          product_items: [
            {
              product_retailer_id: '1276545',
              name: 'Nike Air Zoom Pegasus',
              price: 599.9,
              sale_price: 499.9,
              currency: 'BRL',
              image: 'https://example.com/shoe.png',
              description: 'Running shoe',
              seller_id: '1',
            },
            {
              product_retailer_id: '',
              name: 'Invalid item',
              price: 10,
              image: '',
            },
          ],
        },
      }),
    );

    expect(mapped.productCarousel).toEqual({
      text: 'Check these products',
      items: [
        {
          product_retailer_id: '1276545',
          name: 'Nike Air Zoom Pegasus',
          price: 599.9,
          sale_price: 499.9,
          currency: 'BRL',
          image: 'https://example.com/shoe.png',
          description: 'Running shoe',
          seller_id: '1',
        },
      ],
    });
  });

  it('omits productCarousel when product_items is empty', () => {
    const mapped = mapServiceMessage(
      buildMessage({
        product_carousel: {
          text: 'No products',
          product_items: [],
        },
      }),
    );

    expect(mapped.productCarousel).toBeUndefined();
  });
});
