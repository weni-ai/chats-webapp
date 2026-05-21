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
