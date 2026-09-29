import { toContextLine, type RawRoomMessage } from './roomContext';

export const UNANSWERED_TRIGGER_PREFIX = '[desk_copilot:unanswered_messages]';

export type LastProcessedMessage = {
  messageUuid?: string;
  createdOn?: string;
  processedUuids?: string[];
} | null;

export function isUnansweredTrigger(text?: string | null): boolean {
  return (
    typeof text === 'string' &&
    text.trimStart().startsWith(UNANSWERED_TRIGGER_PREFIX)
  );
}

export function isAgentReply(message: RawRoomMessage): boolean {
  return (
    !!message.user && !message.internal_note && !message.is_automatic_message
  );
}

export function isContactMessage(message: RawRoomMessage): boolean {
  return !!message.contact && !message.internal_note;
}

export function hasInProgressAudioTranscription(
  messages: RawRoomMessage[],
): boolean {
  return messages.some((message) =>
    (message.media || []).some((media) => {
      const type = (media.content_type || '').toLowerCase();
      return (
        type.startsWith('audio/') &&
        media.transcription?.status === 'IN_PROGRESS'
      );
    }),
  );
}

export function findUnansweredMessages(
  messages: RawRoomMessage[],
  lastProcessed?: LastProcessedMessage,
): RawRoomMessage[] {
  let lastAgentIndex = -1;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (isAgentReply(messages[index])) {
      lastAgentIndex = index;
      break;
    }
  }

  const unanswered = messages
    .slice(lastAgentIndex + 1)
    .filter(
      (message) => isContactMessage(message) && toContextLine(message) !== null,
    );

  const processedUuids = new Set(
    (lastProcessed?.processedUuids || []).filter(Boolean),
  );
  if (lastProcessed?.messageUuid) {
    processedUuids.add(lastProcessed.messageUuid);
  }

  let remaining = unanswered;
  if (processedUuids.size) {
    remaining = unanswered.filter(
      (message) => !message.uuid || !processedUuids.has(message.uuid),
    );
  }

  if (lastProcessed?.createdOn) {
    const processedTime = Date.parse(lastProcessed.createdOn);
    if (!Number.isNaN(processedTime)) {
      remaining = remaining.filter((message) => {
        const createdTime = Date.parse(message.created_on || '');
        return !Number.isNaN(createdTime) && createdTime > processedTime;
      });
    }
  }

  return remaining;
}

export function buildUnansweredTrigger(messages: RawRoomMessage[]): string {
  const lines = messages
    .map(toContextLine)
    .filter((line): line is string => Boolean(line));

  return [UNANSWERED_TRIGGER_PREFIX, ...lines].join('\n');
}
