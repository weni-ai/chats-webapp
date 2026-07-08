import { describe, expect, it } from 'vitest';

import {
  getRoomType,
  parseUrn,
  sanitizeDocument,
  buildHistoryContactQuery,
} from '@/utils/room';

describe('room utils', () => {
  describe('getRoomType', () => {
    it('returns "waiting" when not waiting and no user', () => {
      expect(getRoomType({ is_waiting: false, user: null })).toBe('waiting');
    });

    it('returns "ongoing" when user exists and not waiting', () => {
      expect(getRoomType({ is_waiting: false, user: { id: 1 } })).toBe(
        'ongoing',
      );
    });

    it('returns "flow_start" when is_waiting', () => {
      expect(getRoomType({ is_waiting: true, user: null })).toBe('flow_start');
    });
  });

  describe('parseUrn', () => {
    it('returns empty object when room has no urn', () => {
      expect(parseUrn({})).toEqual({});
      expect(parseUrn(null)).toEqual({});
      expect(parseUrn({ urn: '' })).toEqual({});
    });

    it('parses whatsapp urn correctly', () => {
      const result = parseUrn({ urn: 'whatsapp:5511999998888' });
      expect(result.plataform).toBe('whatsapp');
      expect(result.contactNum).toBe('+5511999998888');
    });

    it('parses telegram urn correctly', () => {
      const result = parseUrn({ urn: 'telegram:123456' });
      expect(result.plataform).toBe('telegram');
      expect(result.contactNum).toBe('123456');
    });
  });

  describe('sanitizeDocument', () => {
    it('returns empty string for null/undefined/empty', () => {
      expect(sanitizeDocument(null)).toBe('');
      expect(sanitizeDocument(undefined)).toBe('');
      expect(sanitizeDocument('')).toBe('');
    });

    it('strips dots and hyphens from CPF format', () => {
      expect(sanitizeDocument('234.234.243-20')).toBe('23423424320');
    });

    it('strips hyphens from RG format', () => {
      expect(sanitizeDocument('30404-8')).toBe('304048');
    });

    it('strips spaces, dots, hyphens from mixed formats', () => {
      expect(sanitizeDocument('12.345.678/0001-90')).toBe('12345678000190');
    });

    it('returns already clean string unchanged', () => {
      expect(sanitizeDocument('12345678900')).toBe('12345678900');
    });

    it('strips spaces', () => {
      expect(sanitizeDocument('123 456 789')).toBe('123456789');
    });
  });

  describe('buildHistoryContactQuery', () => {
    it('returns empty object when room has no identifiers', () => {
      expect(buildHistoryContactQuery({ contact: {} })).toEqual({});
      expect(buildHistoryContactQuery({})).toEqual({});
    });

    it('returns only contact when only external_id is present', () => {
      const room = {
        contact: { external_id: 'abc-123' },
      };
      expect(buildHistoryContactQuery(room)).toEqual({ contact: 'abc-123' });
    });

    it('returns only email when only email is present', () => {
      const room = {
        contact: { email: 'test@example.com' },
      };
      expect(buildHistoryContactQuery(room)).toEqual({
        email: 'test@example.com',
      });
    });

    it('returns only sanitized document when only document is present', () => {
      const room = {
        contact: { document: '234.234.243-20' },
      };
      expect(buildHistoryContactQuery(room)).toEqual({
        document: '23423424320',
      });
    });

    it('returns separate params when multiple identifiers exist', () => {
      const room = {
        contact: {
          external_id: 'abc-123',
          email: 'test@example.com',
          document: '123.456.789-00',
        },
      };
      expect(buildHistoryContactQuery(room)).toEqual({
        contact: 'abc-123',
        email: 'test@example.com',
        document: '12345678900',
      });
    });

    it('returns contact and email without document when document is empty', () => {
      const room = {
        contact: {
          external_id: 'abc-123',
          email: 'user@mail.com',
          document: '',
        },
      };
      expect(buildHistoryContactQuery(room)).toEqual({
        contact: 'abc-123',
        email: 'user@mail.com',
      });
    });
  });
});
