import { describe, expect, it } from 'vitest';
import {
  appendStreamingCaret,
  renderLink,
  renderMarkdown,
} from '../renderMarkdown';

const CARET =
  '<span class="ai-message__caret" data-testid="assistant-ai-caret"></span>';

describe('appendStreamingCaret', () => {
  it('inserts the caret before the last paragraph close tag', () => {
    expect(appendStreamingCaret('<p>Your order is on its</p>\n')).toBe(
      `<p>Your order is on its${CARET}</p>\n`,
    );
  });

  it('follows the latest paragraph when several blocks are present', () => {
    expect(appendStreamingCaret('<p>Hello</p>\n<p>World</p>\n')).toBe(
      `<p>Hello</p>\n<p>World${CARET}</p>\n`,
    );
  });

  it('stays inside the last list item', () => {
    expect(
      appendStreamingCaret('<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n'),
    ).toBe(`<ul>\n<li>one</li>\n<li>two${CARET}</li>\n</ul>\n`);
  });

  it('renders a lone caret when there is no markup yet', () => {
    expect(appendStreamingCaret('')).toBe(CARET);
  });
});

describe('renderMarkdown', () => {
  it('returns an empty string for empty text', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders bold text as strong', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('converts bullet points into lists', () => {
    const html = renderMarkdown('• first\n• second');
    expect(html).toContain('<li>');
    expect(html).toContain('first');
    expect(html).toContain('second');
  });

  it('turns single line breaks into br tags', () => {
    expect(renderMarkdown('hello\nworld')).toContain('<br>');
  });

  it('opens links in a new tab with relnoopener', () => {
    const html = renderMarkdown('[Example](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Example');
  });

  it('strips mailto from autolink emails and string tokens', () => {
    expect(renderLink('mailto:user@example.com')).toBe('user@example.com');
    expect(renderMarkdown('<user@example.com>')).not.toContain('mailto:');
    expect(renderMarkdown('<user@example.com>')).toContain('user@example.com');
  });

  it('strips script tags and event handlers from parsed html', () => {
    expect(renderMarkdown('<p>ok</p><script>alert(1)</script>')).toBe(
      '<p>ok</p>',
    );
    expect(renderMarkdown('<img src="x" onerror="alert(1)">')).not.toContain(
      'onerror',
    );
  });
});
