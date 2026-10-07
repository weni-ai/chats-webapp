import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../sanitizeHtml';

describe('sanitizeHtml', () => {
  it('returns an empty string for nullish values', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('preserves safe html and target on anchors', () => {
    expect(
      sanitizeHtml('<a target="_blank" href="https://example.com">Example</a>'),
    ).toBe('<a target="_blank" href="https://example.com">Example</a>');
  });

  it('strips script tags and event handlers', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).toBe(
      '<p>ok</p>',
    );
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe(
      '<img src="x">',
    );
  });
});
