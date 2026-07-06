import { describe, it, expect } from 'vitest';

import { hasTemplateVariables } from '../flowTemplates';

describe('hasTemplateVariables', () => {
  it('returns false for an empty array', () => {
    expect(hasTemplateVariables([])).toBe(false);
  });

  it('returns false when no template has variables', () => {
    expect(
      hasTemplateVariables([
        { variables: [], data: { components: [] } },
        { variables: [], data: { components: [] } },
      ]),
    ).toBe(false);
  });

  it('returns true when at least one template has variables', () => {
    expect(
      hasTemplateVariables([
        { variables: [], data: { components: [] } },
        { variables: ['name'], data: { components: [] } },
      ]),
    ).toBe(true);
  });

  it('handles undefined/null entries gracefully', () => {
    expect(hasTemplateVariables([null, undefined] as any)).toBe(false);
  });
});
