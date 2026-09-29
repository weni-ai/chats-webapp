export type RawRoomMedia = {
  url?: string;
  content_type?: string;
  transcription?: {
    text?: string | null;
    status?: string | null;
  };
};

export type RawRoomMessage = {
  uuid?: string;
  text?: string | null;
  created_on?: string;
  contact?: unknown;
  user?: unknown;
  internal_note?: unknown;
  is_automatic_message?: boolean;
  media?: RawRoomMedia[];
};

export type BuildRoomContextOptions = {
  limit?: number;
  maxChars?: number;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_CHARS = 4000;

const MEDIA_MARKER_PATTERN = /\[(?:image|audio|video|document)\]/;

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

function mediaMarker(contentType?: string): string {
  const type = (contentType || '').toLowerCase();

  if (type.startsWith('image/')) {
    return '[image]';
  }

  if (type.startsWith('audio/')) {
    return '[audio]';
  }

  if (type.startsWith('video/')) {
    return '[video]';
  }

  return '[document]';
}

function toMediaFragment(media: RawRoomMedia): string {
  const marker = mediaMarker(media.content_type);
  const url = typeof media.url === 'string' ? media.url.trim() : '';
  const fragment = url ? `${marker} ${url}` : marker;
  const isAudio = (media.content_type || '').toLowerCase().startsWith('audio/');
  const transcriptionText =
    typeof media.transcription?.text === 'string'
      ? media.transcription.text.trim()
      : '';
  const status = media.transcription?.status;

  if (
    isAudio &&
    transcriptionText &&
    status !== 'FAILED' &&
    status !== 'IN_PROGRESS'
  ) {
    return `${fragment} (transcription: ${transcriptionText})`;
  }

  return fragment;
}

export function toContextLine(message: RawRoomMessage): string | null {
  if (message.internal_note) {
    return null;
  }

  const roleLabel = resolveRoleLabel(message);
  if (!roleLabel) {
    return null;
  }

  const text = typeof message.text === 'string' ? message.text.trim() : '';
  const usableText = text && !isValidJson(text) ? text : '';
  const mediaItems = Array.isArray(message.media) ? message.media : [];
  const mediaFragments = mediaItems.map(toMediaFragment);

  if (!usableText && mediaFragments.length === 0) {
    return null;
  }

  const parts = [usableText, ...mediaFragments].filter(Boolean);
  return `${roleLabel}: ${parts.join(' ')}`;
}

function truncateLine(line: string, maxChars: number): string {
  if (line.length <= maxChars) {
    return line;
  }

  const colonIndex = line.indexOf(': ');
  if (colonIndex === -1) {
    return line.slice(0, maxChars);
  }

  const prefix = line.slice(0, colonIndex + 2);
  const rest = line.slice(colonIndex + 2);
  const mediaStart = rest.search(MEDIA_MARKER_PATTERN);

  if (mediaStart === -1) {
    if (prefix.length >= maxChars) {
      return line.slice(0, maxChars);
    }

    return prefix + rest.slice(0, maxChars - prefix.length);
  }

  const textPart = rest.slice(0, mediaStart).trimEnd();
  const mediaPart = rest.slice(mediaStart);
  const prefixAndMedia = prefix + mediaPart;

  if (textPart) {
    const withText = `${prefix}${textPart} ${mediaPart}`;
    if (withText.length <= maxChars) {
      return withText;
    }

    const textBudget = maxChars - prefix.length - 1 - mediaPart.length;
    if (textBudget > 0) {
      return `${prefix}${textPart.slice(0, textBudget)} ${mediaPart}`;
    }
  }

  if (prefixAndMedia.length <= maxChars) {
    return prefixAndMedia;
  }

  // Never cut a media link in half, even if the line exceeds maxChars.
  return prefixAndMedia;
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
    return truncateLine(result, maxChars);
  }

  return result;
}
