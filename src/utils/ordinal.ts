const EN_ORDINAL_SUFFIXES: Record<Intl.LDMLPluralRule, string> = {
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
};

export const formatOrdinal = (value: number, locale: string): string => {
  const normalized = (locale || 'en').toLowerCase();

  if (normalized.startsWith('pt') || normalized.startsWith('es')) {
    return `${value}º`;
  }

  const rules = new Intl.PluralRules('en', { type: 'ordinal' });
  const suffix = EN_ORDINAL_SUFFIXES[rules.select(value)] ?? 'th';
  return `${value}${suffix}`;
};
