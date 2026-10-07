import { Marked } from 'marked';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

const STREAMING_CARET =
  '<span class="ai-message__caret" data-testid="assistant-ai-caret"></span>';
const TEXT_CONTAINER_CLOSE = /<\/(p|li|h[1-6]|td|th|dd|code)>/gi;

function renderLink(token: string | { href?: string; text?: string }): string {
  if (typeof token === 'string' && token.includes('mailto:')) {
    return token.replace('mailto:', '');
  }

  const href = typeof token === 'string' ? token : token.href || String(token);
  const text = typeof token === 'string' ? token : token.text || String(token);

  return `<a target="_blank" rel="noopener noreferrer" href="${href}">${text}</a>`;
}

const markedInstance = new Marked({
  async: false,
  breaks: true,
  renderer: {
    link(token) {
      return renderLink(token);
    },
  },
});

export function appendStreamingCaret(html: string): string {
  if (!html) return STREAMING_CARET;

  const matches = [...html.matchAll(TEXT_CONTAINER_CLOSE)];
  const last = matches[matches.length - 1];
  if (!last) return `${html}${STREAMING_CARET}`;

  const index = last.index;
  return `${html.slice(0, index)}${STREAMING_CARET}${html.slice(index)}`;
}

export function renderMarkdown(text: string): string {
  if (!text) {
    return '';
  }

  const processedContent = text
    .replace(/\n•\s*/g, '\n* ')
    .replace(/^•\s*/g, '* ');

  const parsedHtml = markedInstance.parse(processedContent);
  const html = typeof parsedHtml === 'string' ? parsedHtml : '';

  return sanitizeHtml(html);
}
