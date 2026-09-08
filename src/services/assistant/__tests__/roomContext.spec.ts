import { describe, it, expect } from 'vitest';

import { buildRoomContext, type RawRoomMessage } from '../roomContext';

function msg(
  overrides: Partial<RawRoomMessage> & { text?: string | null },
): RawRoomMessage {
  return {
    uuid: overrides.uuid || 'msg-1',
    text: overrides.text ?? '',
    created_on: overrides.created_on || '2024-01-01T00:00:00Z',
    contact: overrides.contact,
    user: overrides.user,
    internal_note: overrides.internal_note,
  };
}

describe('buildRoomContext', () => {
  it('returns empty string when there are no relevant messages', () => {
    expect(buildRoomContext([])).toBe('');
    expect(
      buildRoomContext([
        msg({ text: '', contact: { name: 'A' } }),
        msg({ text: null, user: { email: 'a@b.c' } }),
        msg({ text: '   ', contact: { name: 'A' } }),
      ]),
    ).toBe('');
  });

  it('classifies contact and agent messages', () => {
    const result = buildRoomContext([
      msg({ text: 'Hi', contact: { name: 'Cliente' } }),
      msg({ text: 'Hello!', user: { email: 'agent@weni.ai' } }),
    ]);

    expect(result).toBe('Contact: Hi\nAgent: Hello!');
  });

  it('filters internal notes, system JSON and messages without role', () => {
    const result = buildRoomContext([
      msg({
        text: 'nota',
        user: { email: 'agent@weni.ai' },
        internal_note: { uuid: 'note-1' },
      }),
      msg({ text: '{"type":"flow"}', contact: { name: 'Cliente' } }),
      msg({ text: 'sem papel' }),
      msg({ text: 'valid', contact: { name: 'Cliente' } }),
    ]);

    expect(result).toBe('Contact: valid');
  });

  it('keeps only the last N messages according to limit', () => {
    const messages = Array.from({ length: 5 }, (_, index) =>
      msg({
        uuid: `msg-${index}`,
        text: `m${index}`,
        contact: { name: 'Cliente' },
      }),
    );

    expect(buildRoomContext(messages, { limit: 2 })).toBe(
      'Contact: m3\nContact: m4',
    );
  });

  it('drops oldest lines until the context fits maxChars', () => {
    const messages = [
      msg({ text: 'aaaaaaaaaa', contact: { name: 'Cliente' } }),
      msg({ text: 'bbbbbbbbbb', user: { email: 'agent@weni.ai' } }),
      msg({ text: 'cccccccccc', contact: { name: 'Cliente' } }),
    ];

    const result = buildRoomContext(messages, { maxChars: 25 });

    expect(result).toBe('Contact: cccccccccc');
    expect(result.length).toBeLessThanOrEqual(25);
  });

  it('truncates a single oversized line to maxChars', () => {
    const longText = 'x'.repeat(100);
    const result = buildRoomContext(
      [msg({ text: longText, contact: { name: 'Cliente' } })],
      { maxChars: 30 },
    );

    expect(result.length).toBe(30);
    expect(result.endsWith('x'.repeat(30))).toBe(true);
  });
});
