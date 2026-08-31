import i18n from '@/plugins/i18n';

export function parseProductPrice(price: string | number | undefined): number {
  if (typeof price === 'number' && Number.isFinite(price)) {
    return price;
  }

  if (typeof price !== 'string') {
    return 0;
  }

  const normalized = price.replace(/[^0-9.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPriceWithCurrency(
  price: string | number | undefined,
  currency = 'BRL',
): string {
  const value = parseProductPrice(price);
  const language = i18n.global.locale.value || 'en';

  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  } catch {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'BRL',
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  }
}
