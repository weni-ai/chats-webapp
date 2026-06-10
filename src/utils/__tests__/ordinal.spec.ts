import { describe, it, expect } from 'vitest';

import { formatOrdinal } from '../ordinal';

describe('formatOrdinal', () => {
  describe('English locale', () => {
    it('uses "st" for numbers ending in 1 (except 11)', () => {
      expect(formatOrdinal(1, 'en')).toBe('1st');
      expect(formatOrdinal(21, 'en')).toBe('21st');
    });

    it('uses "nd" for numbers ending in 2 (except 12)', () => {
      expect(formatOrdinal(2, 'en')).toBe('2nd');
      expect(formatOrdinal(22, 'en')).toBe('22nd');
    });

    it('uses "rd" for numbers ending in 3 (except 13)', () => {
      expect(formatOrdinal(3, 'en')).toBe('3rd');
      expect(formatOrdinal(23, 'en')).toBe('23rd');
    });

    it('uses "th" for other numbers', () => {
      expect(formatOrdinal(4, 'en')).toBe('4th');
      expect(formatOrdinal(11, 'en')).toBe('11th');
      expect(formatOrdinal(12, 'en')).toBe('12th');
      expect(formatOrdinal(13, 'en')).toBe('13th');
    });
  });

  describe('Portuguese and Spanish locales', () => {
    it('uses the masculine ordinal indicator for pt-br', () => {
      expect(formatOrdinal(1, 'pt-br')).toBe('1º');
      expect(formatOrdinal(3, 'pt-br')).toBe('3º');
    });

    it('uses the masculine ordinal indicator for es', () => {
      expect(formatOrdinal(1, 'es')).toBe('1º');
      expect(formatOrdinal(10, 'es')).toBe('10º');
    });
  });

  describe('fallbacks', () => {
    it('defaults to English formatting when locale is empty', () => {
      expect(formatOrdinal(1, '')).toBe('1st');
    });

    it('is case insensitive for the locale', () => {
      expect(formatOrdinal(2, 'PT-BR')).toBe('2º');
    });
  });
});
