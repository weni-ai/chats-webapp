import { describe, it, expect, beforeEach, vi } from 'vitest';
import env from '@/utils/env';

describe('env', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();

    vi.stubGlobal('import.meta', { env: {} });

    vi.stubGlobal('window', { configs: {} });
  });

  it('returns value from import.meta.env', () => {
    import.meta.env.TEST_VAR = 'test-value';

    expect(env('TEST_VAR')).toBe('test-value');
  });

  it('prioritizes import.meta.env over window.configs', () => {
    window.configs.TEST_VAR = 'window-value';
    import.meta.env.TEST_VAR = 'env-value';

    expect(env('TEST_VAR')).toBe('env-value');
  });

  it('returns undefined for non-existent variables', () => {
    expect(env('NON_EXISTENT_VAR')).toBeUndefined();
  });

  it('handles undefined window.configs', () => {
    vi.stubGlobal('window', {});
    import.meta.env.TEST_VAR = 'env-value';

    expect(env('TEST_VAR')).toBe('env-value');
  });
});
