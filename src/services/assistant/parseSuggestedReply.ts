export interface ParsedSuggestedReply {
  leading: string;
  reply: string;
  trailing: string;
  hasBlock: boolean;
}

const OPENING_FENCE = /```suggested-reply[ \t]*\r?\n?/i;
const SUGGESTED_REPLY_LABEL = 'suggested-reply';

function emptyParse(text: string): ParsedSuggestedReply {
  return {
    leading: text,
    reply: '',
    trailing: '',
    hasBlock: false,
  };
}

function stripTrailingNewline(text: string): string {
  if (text.endsWith('\r\n')) {
    return text.slice(0, -2);
  }

  if (text.endsWith('\n') || text.endsWith('\r')) {
    return text.slice(0, -1);
  }

  return text;
}

function isPrefixOfSuggestedReplyLabel(after: string): boolean {
  if (after.includes('\n') || after.includes('\r')) {
    return false;
  }

  return SUGGESTED_REPLY_LABEL.startsWith(after.trimEnd().toLowerCase());
}

function stripIncompleteOpeningFence(text: string): string {
  const tripleIndex = text.lastIndexOf('```');
  if (tripleIndex !== -1) {
    const after = text.slice(tripleIndex + 3);
    if (isPrefixOfSuggestedReplyLabel(after)) {
      return stripTrailingNewline(text.slice(0, tripleIndex));
    }

    return text;
  }

  if (text.endsWith('``') || text.endsWith('`')) {
    const ticks = text.endsWith('``') ? 2 : 1;
    const before = text.slice(0, -ticks);
    if (before.endsWith('\n') || before.endsWith('\r') || before.length === 0) {
      return stripTrailingNewline(before);
    }
  }

  return text;
}

function removeClosingFence(after: string): string {
  const closingIndex = after.indexOf('```');
  if (closingIndex === -1) {
    return after;
  }

  return `${stripTrailingNewline(after.slice(0, closingIndex))}${after.slice(closingIndex + 3)}`;
}

export function parseSuggestedReply(text: string): ParsedSuggestedReply {
  if (!text) {
    return emptyParse('');
  }

  OPENING_FENCE.lastIndex = 0;
  const opening = OPENING_FENCE.exec(text);
  if (!opening) {
    return emptyParse(text);
  }

  const contentStart = opening.index + opening[0].length;
  const closingIndex = text.indexOf('```', contentStart);
  if (closingIndex === -1) {
    return emptyParse(text);
  }

  const reply = text.slice(contentStart, closingIndex).trim();
  if (!reply) {
    return emptyParse(text);
  }

  return {
    leading: text.slice(0, opening.index).trim(),
    reply,
    trailing: text.slice(closingIndex + 3).trim(),
    hasBlock: true,
  };
}

export function stripSuggestedReplyFences(text: string): string {
  if (!text) {
    return '';
  }

  OPENING_FENCE.lastIndex = 0;
  const opening = OPENING_FENCE.exec(text);
  if (opening) {
    const before = text.slice(0, opening.index);
    const after = removeClosingFence(
      text.slice(opening.index + opening[0].length),
    );
    return `${before}${after}`;
  }

  return stripIncompleteOpeningFence(text);
}
