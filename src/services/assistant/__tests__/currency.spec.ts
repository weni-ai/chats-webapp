import { describe, it, expect } from 'vitest';
import { parseProductPrice } from '../currency';

describe('parseProductPrice', () => {
  it('returns finite numbers as-is', () => {
    expect(parseProductPrice(27.5)).toBe(27.5);
  });

  it('parses US-formatted prices with thousands separators', () => {
    expect(parseProductPrice('1,234.56')).toBe(1234.56);
  });

  it('parses BR-formatted prices with comma decimals', () => {
    expect(parseProductPrice('1.234,56')).toBe(1234.56);
  });

  it('parses simple comma decimals', () => {
    expect(parseProductPrice('27,00')).toBe(27);
  });

  it('returns 0 for invalid values', () => {
    expect(parseProductPrice(undefined)).toBe(0);
    expect(parseProductPrice('abc')).toBe(0);
  });
});
