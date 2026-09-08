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
      msg({ text: 'Oi', contact: { name: 'Cliente' } }),
      msg({ text: 'Olá!', user: { email: 'agent@weni.ai' } }),
    ]);

    expect(result).toBe('Contato: Oi\nAgente: Olá!');
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
      msg({ text: 'válida', contact: { name: 'Cliente' } }),
    ]);

    expect(result).toBe('Contato: válida');
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
      'Contato: m3\nContato: m4',
    );
  });

  it('drops oldest lines until the context fits maxChars', () => {
    const messages = [
      msg({ text: 'aaaaaaaaaa', contact: { name: 'Cliente' } }),
      msg({ text: 'bbbbbbbbbb', user: { email: 'agent@weni.ai' } }),
      msg({ text: 'cccccccccc', contact: { name: 'Cliente' } }),
    ];

    // "Contato: aaaaaaaaaa" = 19 chars; with newlines each line is longer.
    // With a tight maxChars only the newest line(s) should remain.
    const result = buildRoomContext(messages, { maxChars: 25 });

    expect(result).toBe('Contato: cccccccccc');
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
