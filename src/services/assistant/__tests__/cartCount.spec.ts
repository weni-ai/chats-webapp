import { describe, it, expect } from 'vitest';
import { extractCartCount } from '../cartCount';

describe('extractCartCount', () => {
  it('returns 0 for empty payloads', () => {
    expect(extractCartCount(null)).toBe(0);
    expect(extractCartCount(undefined)).toBe(0);
    expect(extractCartCount('invalid')).toBe(0);
  });

  it('accepts a numeric payload', () => {
    expect(extractCartCount(3)).toBe(3);
    expect(extractCartCount(-1)).toBe(0);
  });

  it('reads count from the root object', () => {
    expect(extractCartCount({ count: 2 })).toBe(2);
  });

  it('reads items length from the root object', () => {
    expect(extractCartCount({ items: [{ id: 1 }, { id: 2 }] })).toBe(2);
  });

  it('reads count and items from nested data', () => {
    expect(extractCartCount({ data: { count: 4 } })).toBe(4);
    expect(extractCartCount({ data: { items: [{ id: 1 }] } })).toBe(1);
  });
});
