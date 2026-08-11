import IntlMessageFormat from 'intl-messageformat';

/**
 * Matches real ICU blocks only: {var, plural|selectordinal, <branch> { … }
 * or {var, select, <key> { … }. Avoids false positives like
 * "{user, select another option}" or "{item, plural forms available}".
 */
const ICU_PLURAL_OR_SELECTORDINAL_PATTERN =
  /\{([a-zA-Z][\w]*),\s*(?:plural|selectordinal)\s*,\s*(?:(?:=\d+)|zero|one|two|few|many|other)\s*\{/i;

const ICU_SELECT_PATTERN = /\{([a-zA-Z][\w]*),\s*select\s*,\s*[\w#.-]+\s*\{/i;

export function shouldUseIntlMessageFormat(message) {
  return (
    ICU_PLURAL_OR_SELECTORDINAL_PATTERN.test(message) ||
    ICU_SELECT_PATTERN.test(message)
  );
}

/** Tag names in ICU XML markup (<b>, <i>, <br/>) need function handlers in .format(). */
const ICU_XML_TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b/g;

function formatNamedPlaceholders(message, values) {
  if (!values || typeof values !== 'object') {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (match, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) {
      return match;
    }
    const value = values[name];
    return value == null ? '' : String(value);
  });
}

function createDefaultTagHandler(tagName) {
  if (tagName === 'br') {
    return (chunks) => chunks.join('') + '<br/>';
  }

  return (chunks) => {
    const content = chunks.join('');
    return `<${tagName}>${content}</${tagName}>`;
  };
}

/**
 * Merges $t params with default ICU tag handlers so plural + HTML works without
 * passing b/i/br manually on every call.
 */
function buildIntlFormatValues(message, values = {}) {
  const formatValues = { ...(values || {}) };
  let match;

  while ((match = ICU_XML_TAG_PATTERN.exec(message)) !== null) {
    const tagName = match[1];
    const existing = formatValues[tagName];

    if (typeof existing === 'function') {
      continue;
    }

    formatValues[tagName] = createDefaultTagHandler(tagName);
  }

  ICU_XML_TAG_PATTERN.lastIndex = 0;
  return formatValues;
}

/**
 * Vue I18n custom messageCompiler: ICU plural/select via IntlMessageFormat;
 * plain strings (HTML, simple {name}) use named interpolation only.
 */
export function icuMessageCompiler(message, { locale, key, onError }) {
  if (typeof message === 'string') {
    if (shouldUseIntlMessageFormat(message)) {
      const formatter = new IntlMessageFormat(message, locale);
      return (ctx) =>
        formatter.format(buildIntlFormatValues(message, ctx.values));
    }

    return (ctx) => formatNamedPlaceholders(message, ctx.values);
  }

  onError && onError(new Error('not support for AST'));
  return () => key;
}
