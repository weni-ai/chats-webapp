import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

const SANITIZE_CONFIG: Config = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target'],
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: false,
    attributeNameCheck: false,
    allowCustomizedBuiltInElements: false,
  },
};

export function sanitizeHtml(dirty: string | null | undefined): string {
  return DOMPurify.sanitize(dirty ?? '', SANITIZE_CONFIG);
}

export default sanitizeHtml;
