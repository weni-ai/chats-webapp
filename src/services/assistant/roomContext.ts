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

function isValidJson(message: string): boolean {
  try {
    const parsedObject = JSON.parse(message);
    return typeof parsedObject === 'object' && parsedObject !== null;
  } catch {
    return false;
  }
}

function resolveRole(message: RawRoomMessage): 'contato' | 'agente' | null {
  if (message.contact) {
    return 'contato';
  }

  if (message.user) {
    return 'agente';
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

  const role = resolveRole(message);
  if (!role) {
    return null;
  }

  return `${role === 'contato' ? 'Contato' : 'Agente'}: ${text}`;
}

/**
 * Serializes the latest room messages into a plain-text context string
 * for Copilot `setContext`.
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
    return result.slice(-maxChars);
  }

  return result;
}
