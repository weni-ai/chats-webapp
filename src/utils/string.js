export const isString = (value) => {
  return typeof value === 'string';
};

export const normalizeText = (text) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Format the text of a message to be displayed in the chat.
 * @param {string} text - The text to format.
 * @returns {string} The formatted text.
 */
export const formatMessageText = (text) => {
  function treatTextUrl(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
  }

  function removeHtmlDangerousContent(text) {
    return text.replace(
      /<(\/)?([^> ]+)( [^>]+)?>/gi,
      ($1, $2 = '', $3, $4 = '') => {
        if (['b', 'i', 'u', 'ul', 'li', 'br', 'div'].includes($3)) {
          const complements = [];

          for (const i of $4.matchAll(
            /((?<name1>[^ =]+)="(?<value1>[^"]*)"|(?<name2>[^ =]+)='(?<value2>[^"]*)')/g,
          )) {
            const name = i.groups.name1 || i.groups.name2;
            const value = i.groups.value1 || i.groups.value2;

            if (name === 'style') {
              const styles = [];

              for (const j of value.matchAll(
                /(?<propertyName>[^:]+):(?<propertyValue>[^;]+);?/g,
              )) {
                if (
                  j.groups.propertyName.toLowerCase().trim() === 'text-align'
                ) {
                  styles.push(
                    `${j.groups.propertyName
                      .toLowerCase()
                      .trim()}: ${j.groups.propertyValue.trim()}`,
                  );
                }
              }

              complements.push(`style="${styles.join('; ')};"`);
            }
          }

          return `<${$2}${$3}${
            complements.length ? ` ${complements.join(' ')}` : ''
          }>`;
        }

        return '';
      },
    );
  }

  const formattedText = treatTextUrl(
    removeHtmlDangerousContent(text).trim()?.replace(/\n/g, '<br/>'),
  );

  return typeof text === 'string' ? formattedText : '';
};
