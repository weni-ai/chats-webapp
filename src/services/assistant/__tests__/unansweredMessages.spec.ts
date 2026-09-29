import { describe, it, expect } from 'vitest';

import type { RawRoomMessage } from '../roomContext';
import {
  UNANSWERED_TRIGGER_PREFIX,
  buildUnansweredTrigger,
  findUnansweredMessages,
  hasInProgressAudioTranscription,
  isAgentReply,
  isUnansweredTrigger,
} from '../unansweredMessages';

function contactMessage(
  overrides: Partial<RawRoomMessage> = {},
): RawRoomMessage {
  return {
    uuid: 'c-1',
    text: 'Oi',
    created_on: '2024-01-01T00:00:00Z',
    contact: { name: 'Cliente' },
    ...overrides,
  };
}

function agentMessage(overrides: Partial<RawRoomMessage> = {}): RawRoomMessage {
  return {
    uuid: 'a-1',
    text: 'Olá',
    created_on: '2024-01-01T00:01:00Z',
    user: { email: 'agent@weni.ai' },
    ...overrides,
  };
}

describe('unansweredMessages', () => {
  it('detects the proactive trigger prefix', () => {
    expect(
      isUnansweredTrigger(`${UNANSWERED_TRIGGER_PREFIX}\nContact: Oi`),
    ).toBe(true);
    expect(isUnansweredTrigger(`  ${UNANSWERED_TRIGGER_PREFIX}`)).toBe(true);
    expect(isUnansweredTrigger('Contact: Oi')).toBe(false);
    expect(isUnansweredTrigger(undefined)).toBe(false);
  });

  it('counts human agent messages as replies and ignores notes and automatics', () => {
    expect(isAgentReply(agentMessage())).toBe(true);
    expect(
      isAgentReply(agentMessage({ internal_note: { uuid: 'note-1' } })),
    ).toBe(false);
    expect(isAgentReply(agentMessage({ is_automatic_message: true }))).toBe(
      false,
    );
    expect(isAgentReply(contactMessage())).toBe(false);
  });

  it('returns contact messages after the last agent reply', () => {
    const messages = [
      contactMessage({ uuid: 'c-1', text: 'antes' }),
      agentMessage(),
      contactMessage({
        uuid: 'c-2',
        text: 'depois',
        created_on: '2024-01-01T00:02:00Z',
      }),
    ];

    expect(
      findUnansweredMessages(messages).map((message) => message.uuid),
    ).toEqual(['c-2']);
  });

  it('returns all usable contact messages when there is no agent reply', () => {
    const messages = [
      contactMessage({ uuid: 'c-1', text: 'um' }),
      contactMessage({ uuid: 'c-2', text: 'dois' }),
    ];

    expect(
      findUnansweredMessages(messages).map((message) => message.uuid),
    ).toEqual(['c-1', 'c-2']);
  });

  it('ignores empty JSON-only contact messages without media', () => {
    const messages = [
      contactMessage({ text: '{"type":"flow"}' }),
      contactMessage({ uuid: 'c-2', text: '   ' }),
    ];

    expect(findUnansweredMessages(messages)).toEqual([]);
  });

  it('includes media-only contact messages', () => {
    const messages = [
      contactMessage({
        uuid: 'img-1',
        text: '',
        media: [
          { url: 'https://cdn.example/a.png', content_type: 'image/png' },
        ],
      }),
    ];

    expect(findUnansweredMessages(messages)).toHaveLength(1);
  });

  it('skips messages already processed by uuid', () => {
    const messages = [
      contactMessage({ uuid: 'c-1', text: 'um' }),
      contactMessage({ uuid: 'c-2', text: 'dois' }),
    ];

    expect(
      findUnansweredMessages(messages, { messageUuid: 'c-1' }).map(
        (message) => message.uuid,
      ),
    ).toEqual(['c-2']);
  });

  it('excludes any uuid in processedUuids even when createdOn is out of order', () => {
    const messages = [
      contactMessage({
        uuid: 'c-old',
        text: 'já vista',
        created_on: '2024-01-01T00:06:00Z',
      }),
      contactMessage({
        uuid: 'c-ancient',
        text: 'antiga',
        created_on: '2024-01-01T00:03:00Z',
      }),
      contactMessage({
        uuid: 'c-new',
        text: 'nova',
        created_on: '2024-01-01T00:05:00Z',
      }),
    ];

    expect(
      findUnansweredMessages(messages, {
        messageUuid: 'c-old',
        createdOn: '2024-01-01T00:04:00Z',
        processedUuids: ['c-old'],
      }).map((message) => message.uuid),
    ).toEqual(['c-new']);
  });

  it('uses createdOn when the processed uuid is no longer loaded', () => {
    const messages = [
      contactMessage({
        uuid: 'c-new',
        text: 'nova',
        created_on: '2024-01-01T00:05:00Z',
      }),
    ];

    expect(
      findUnansweredMessages(messages, {
        messageUuid: 'missing',
        createdOn: '2024-01-01T00:04:00Z',
      }).map((message) => message.uuid),
    ).toEqual(['c-new']);
  });

  it('builds the hidden trigger with the prefix and contact lines', () => {
    const trigger = buildUnansweredTrigger([
      contactMessage({ text: 'Oi' }),
      contactMessage({
        uuid: 'img-1',
        text: '',
        media: [
          { url: 'https://cdn.example/a.png', content_type: 'image/png' },
        ],
      }),
    ]);

    expect(trigger.startsWith(UNANSWERED_TRIGGER_PREFIX)).toBe(true);
    expect(trigger).toContain('Contact: Oi');
    expect(trigger).toContain('[image] https://cdn.example/a.png');
  });

  it('detects in-progress audio transcriptions', () => {
    expect(
      hasInProgressAudioTranscription([
        contactMessage({
          media: [
            {
              url: 'https://cdn.example/a.mp3',
              content_type: 'audio/mpeg',
              transcription: { status: 'IN_PROGRESS' },
            },
          ],
        }),
      ]),
    ).toBe(true);

    expect(
      hasInProgressAudioTranscription([
        contactMessage({
          media: [
            {
              url: 'https://cdn.example/a.mp3',
              content_type: 'audio/mpeg',
              transcription: { status: 'DONE', text: 'olá' },
            },
          ],
        }),
      ]),
    ).toBe(false);
  });
});
