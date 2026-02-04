export const isString = (value) => {
  return typeof value === 'string';
};

export const normalizeText = (text) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};
