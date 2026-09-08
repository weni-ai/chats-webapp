export type RawRoomMessage = {
  uuid?: string;
  text?: string | null;
  created_on?: string;
  contact?: unknown;
  user?: unknown;
  internal_note?: unknown;
};

export type BuildRoomContextOptions = {
  limit?: number;
  maxChars?: number;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_CHARS = 4000;

/**
 * Stable English role labels for the Copilot `setContext` payload.
 * Intentionally NOT localized: backend protocol constants (same approach as
 * webchat-react product context labels). Not rendered in the chats-webapp UI.
 */
const ROLE_LABEL = {
  contact: 'Contact',
  agent: 'Agent',
} as const;

function isValidJson(message: string): boolean {
  try {
    const parsedObject = JSON.parse(message);
    return typeof parsedObject === 'object' && parsedObject !== null;
  } catch {
    return false;
  }
}

function resolveRoleLabel(message: RawRoomMessage): string | null {
  if (message.contact) {
    return ROLE_LABEL.contact;
  }

  if (message.user) {
    return ROLE_LABEL.agent;
  }

  return null;
}

function toContextLine(message: RawRoomMessage): string | null {
  if (message.internal_note) {
    return null;
  }

  const text = typeof message.text === 'string' ? message.text.trim() : '';
  if (!text || isValidJson(text)) {
    return null;
  }

  const roleLabel = resolveRoleLabel(message);
  if (!roleLabel) {
    return null;
  }

  return `${roleLabel}: ${text}`;
}

/**
 * Serializes the latest room messages into a plain-text context string
 * for Copilot `setContext` (backend payload, not UI copy).
 */
export function buildRoomContext(
  messages: RawRoomMessage[],
  options: BuildRoomContextOptions = {},
): string {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  const lines = messages
    .map(toContextLine)
    .filter((line): line is string => Boolean(line))
    .slice(-limit);

  if (!lines.length) {
    return '';
  }

  let result = lines.join('\n');

  while (result.length > maxChars && lines.length > 1) {
    lines.shift();
    result = lines.join('\n');
  }

  if (result.length > maxChars) {
    const colonIndex = result.indexOf(': ');
    if (colonIndex !== -1) {
      const prefix = result.slice(0, colonIndex + 2);
      if (prefix.length >= maxChars) {
        return result.slice(0, maxChars);
      }

      const textBudget = maxChars - prefix.length;
      return prefix + result.slice(prefix.length, prefix.length + textBudget);
    }

    return result.slice(0, maxChars);
  }

  return result;
}
