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
});
