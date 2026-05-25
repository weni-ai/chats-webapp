import { describe, it, expect } from 'vitest';

import {
  CONTACT_NAME_TOKEN,
  CONTACT_URN_TOKEN,
  AGENT_NAME_TOKEN,
  AGENT_EMAIL_TOKEN,
  getContactName,
  getContactUrn,
  getAgentName,
  getAgentEmail,
  getAvailableLocalVariables,
  resolveLocalVariablesInValue,
  resolveAllValues,
} from '../localVariables';

describe('localVariables helpers', () => {
  describe('getContactName', () => {
    it('returns the trimmed contact name', () => {
      expect(getContactName({ name: '  Joao  ' })).toBe('Joao');
    });

    it('returns empty when contact is undefined', () => {
      expect(getContactName(undefined)).toBe('');
    });
  });

  describe('getContactUrn', () => {
    it('extracts the path from urns[0] object shape', () => {
      expect(
        getContactUrn({
          urns: [{ scheme: 'whatsapp', path: '+5511999999999' }],
        }),
      ).toBe('+5511999999999');
    });

    it('extracts the path from a `scheme:path` string', () => {
      expect(getContactUrn({ urns: ['whatsapp:+5521988888888'] as any })).toBe(
        '+5521988888888',
      );
    });

    it('falls back to the direct `urn` property when present', () => {
      expect(getContactUrn({ urn: 'whatsapp:+555533332222' })).toBe(
        '+555533332222',
      );
    });

    it('falls back to the active room contact when contact has no urn', () => {
      expect(
        getContactUrn({}, { contact: { urn: 'whatsapp:+557788889999' } }),
      ).toBe('+557788889999');
    });

    it('returns empty when neither contact nor room have a urn', () => {
      expect(getContactUrn({})).toBe('');
    });
  });

  describe('getAgentName', () => {
    it('composes first and last name', () => {
      expect(getAgentName({ first_name: 'Ada', last_name: 'Lovelace' })).toBe(
        'Ada Lovelace',
      );
    });

    it('falls back to email when first/last are missing', () => {
      expect(getAgentName({ email: 'agent@example.com' })).toBe(
        'agent@example.com',
      );
    });

    it('returns empty when agent is undefined', () => {
      expect(getAgentName(undefined)).toBe('');
    });
  });

  describe('getAgentEmail', () => {
    it('returns the trimmed email', () => {
      expect(getAgentEmail({ email: '  agent@example.com ' })).toBe(
        'agent@example.com',
      );
    });

    it('returns empty when agent has no email', () => {
      expect(getAgentEmail({})).toBe('');
    });
  });

  describe('getAvailableLocalVariables', () => {
    const fullContact = {
      name: 'Joao',
      urns: [{ scheme: 'whatsapp', path: '+5511999999999' }],
    };

    it('returns the 4 variables when every contact and the agent have data', () => {
      const available = getAvailableLocalVariables({
        contacts: [fullContact, { ...fullContact, name: 'Maria' }],
        agent: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@x.com' },
      });

      expect(available.map((v) => v.token)).toEqual([
        CONTACT_NAME_TOKEN,
        CONTACT_URN_TOKEN,
        AGENT_NAME_TOKEN,
        AGENT_EMAIL_TOKEN,
      ]);
    });

    it('hides contact.name when one contact lacks a name', () => {
      const available = getAvailableLocalVariables({
        contacts: [fullContact, { ...fullContact, name: '' }],
        agent: { email: 'ada@x.com' },
      });

      expect(available.map((v) => v.token)).not.toContain(CONTACT_NAME_TOKEN);
    });

    it('hides contact.urn when one contact lacks a urn (and no room fallback)', () => {
      const available = getAvailableLocalVariables({
        contacts: [fullContact, { name: 'NoPhone' }],
        agent: { email: 'ada@x.com' },
      });

      expect(available.map((v) => v.token)).not.toContain(CONTACT_URN_TOKEN);
    });

    it('hides agent variables when the agent has no data', () => {
      const available = getAvailableLocalVariables({
        contacts: [fullContact],
      });

      expect(available.map((v) => v.token)).not.toContain(AGENT_NAME_TOKEN);
      expect(available.map((v) => v.token)).not.toContain(AGENT_EMAIL_TOKEN);
    });

    it('uses the first contact for previewValue', () => {
      const available = getAvailableLocalVariables({
        contacts: [fullContact, { ...fullContact, name: 'Maria' }],
        agent: { first_name: 'Ada' },
      });

      const contactName = available.find((v) => v.token === CONTACT_NAME_TOKEN);
      expect(contactName?.previewValue).toBe('Joao');
    });

    it('returns an empty list when no contacts are provided', () => {
      const available = getAvailableLocalVariables({ contacts: [] });
      expect(available).toEqual([]);
    });
  });

  describe('resolveLocalVariablesInValue', () => {
    it('replaces contact tokens using the provided contact', () => {
      expect(
        resolveLocalVariablesInValue('Hello {{contact.name}}', {
          contact: { name: 'Joao' },
        }),
      ).toBe('Hello Joao');
    });

    it('replaces every occurrence of the same token', () => {
      expect(
        resolveLocalVariablesInValue('{{contact.name}} - {{contact.name}}', {
          contact: { name: 'Joao' },
        }),
      ).toBe('Joao - Joao');
    });

    it('returns the original string when no token is present', () => {
      expect(
        resolveLocalVariablesInValue('Plain text', { contact: { name: 'X' } }),
      ).toBe('Plain text');
    });

    it('returns empty string for empty input', () => {
      expect(resolveLocalVariablesInValue('', {})).toBe('');
    });

    it('replaces agent tokens', () => {
      expect(
        resolveLocalVariablesInValue('from {{agent.name}} ({{agent.email}})', {
          agent: { first_name: 'Ada', last_name: 'Lovelace', email: 'a@x.com' },
        }),
      ).toBe('from Ada Lovelace (a@x.com)');
    });
  });

  describe('resolveAllValues', () => {
    it('resolves tokens per field using the supplied context', () => {
      const result = resolveAllValues(
        {
          var1: 'Hi {{contact.name}}',
          var2: '{{agent.name}}',
          var3: 'static',
        },
        {
          contact: { name: 'Joao' },
          agent: { first_name: 'Ada', last_name: 'Lovelace' },
        },
      );

      expect(result).toEqual({
        var1: 'Hi Joao',
        var2: 'Ada Lovelace',
        var3: 'static',
      });
    });
  });
});
