import { describe, it, expect } from 'vitest';
import en from '@/locales/en.json';
import {
  icuMessageCompiler,
  shouldUseIntlMessageFormat,
} from '../icuMessageCompiler.js';

function collectStrings(node, out = []) {
  if (typeof node === 'string') {
    out.push(node);
    return out;
  }
  if (node && typeof node === 'object') {
    Object.values(node).forEach((value) => collectStrings(value, out));
  }
  return out;
}

describe('shouldUseIntlMessageFormat', () => {
  it('detects all plural messages in en.json', () => {
    const pluralStrings = collectStrings(en).filter((s) =>
      /,\s*plural\s*,/.test(s),
    );

    expect(pluralStrings.length).toBeGreaterThan(0);
    pluralStrings.forEach((message) => {
      expect(shouldUseIntlMessageFormat(message)).toBe(true);
    });
  });

  it('does not treat prose with ", select" or ", plural" as ICU', () => {
    expect(
      shouldUseIntlMessageFormat(
        'The selected project is already associated, select another project to continue.',
      ),
    ).toBe(false);
    expect(
      shouldUseIntlMessageFormat('{user, select another option for {name}}'),
    ).toBe(false);
    expect(
      shouldUseIntlMessageFormat('{item, plural forms are not supported here}'),
    ).toBe(false);
    expect(
      shouldUseIntlMessageFormat(
        'You have not added any quick messages yet. Click the <i>+ Message</i> button.',
      ),
    ).toBe(false);
  });

  it('detects select and selectordinal ICU blocks', () => {
    expect(
      shouldUseIntlMessageFormat(
        '{gender, select, male {He} female {She} other {They}}',
      ),
    ).toBe(true);
    expect(
      shouldUseIntlMessageFormat(
        '{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}',
      ),
    ).toBe(true);
  });
});

function compileMessage(message, values, locale = 'en') {
  const compile = icuMessageCompiler(message, {
    locale,
    key: 'test',
    onError: null,
  });

  return compile({ values });
}

describe('icuMessageCompiler plural messages', () => {
  it('formats one and other branches from en.json', () => {
    expect(compileMessage(en.chats_count, { count: 1 })).toBe('1 chat');
    expect(compileMessage(en.chats_count, { count: 3 })).toBe('3 chats');
  });

  it('formats =0 branch for send_docs', () => {
    expect(compileMessage(en.send_docs, { count: 0 })).toBe('Send doc');
    expect(compileMessage(en.send_docs, { count: 2 })).toBe('Send docs');
  });

  it('formats plural with extra placeholders in the same message', () => {
    expect(
      compileMessage(en.bulk_take.partial_success_message, {
        success: 1,
        failed: 2,
      }),
    ).toBe('1 chat taken over, 2 failed. Please try again.');
    expect(
      compileMessage(en.bulk_take.partial_success_message, {
        success: 3,
        failed: 1,
      }),
    ).toBe('3 chats taken over, 1 failed. Please try again.');
  });

  it('formats plural with named variable n', () => {
    expect(compileMessage(en.waiting_for.minutes, { n: 1 })).toBe(
      '1 minute waiting',
    );
    expect(compileMessage(en.waiting_for.minutes, { n: 5 })).toBe(
      '5 minutes waiting',
    );
  });

  it('formats transfer_contact singular and plural labels', () => {
    expect(compileMessage(en.transfer_contact, { count: 1 })).toBe(
      'Transfer contact',
    );
    expect(compileMessage(en.transfer_contact, { count: 4 })).toBe(
      'Transfer contacts',
    );
  });
});

describe('icuMessageCompiler', () => {
  it('keeps HTML literal on non-ICU messages', () => {
    const compile = icuMessageCompiler(
      'Click the <i>+ Message</i> button and add {name}.',
      { locale: 'en', key: 'test', onError: null },
    );

    expect(compile({ values: { name: 'Ana' } })).toBe(
      'Click the <i>+ Message</i> button and add Ana.',
    );
  });
});
