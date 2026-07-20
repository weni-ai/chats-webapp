import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/vue';

vi.mock('@sentry/vue', () => ({
  captureException: vi.fn(),
}));

async function loadModuleFederation({
  publicPathUrl,
  origin = 'http://localhost:3002',
}: {
  publicPathUrl?: string;
  origin?: string;
}) {
  vi.resetModules();
  vi.unstubAllGlobals();

  if (publicPathUrl !== undefined) {
    process.env.PUBLIC_PATH_URL = publicPathUrl;
  } else {
    delete process.env.PUBLIC_PATH_URL;
  }

  vi.stubGlobal('import.meta', {
    env: publicPathUrl !== undefined ? { PUBLIC_PATH_URL: publicPathUrl } : {},
  });

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { origin },
  });

  return import('../moduleFederation');
}

describe('moduleFederation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PUBLIC_PATH_URL;
  });

  describe('isFederatedModule', () => {
    it('is false when PUBLIC_PATH_URL is not configured', async () => {
      const { isFederatedModule } = await loadModuleFederation({});

      expect(isFederatedModule).toBe(false);
    });

    it('is false when the bundle runs on its own origin', async () => {
      const { isFederatedModule } = await loadModuleFederation({
        publicPathUrl: 'http://localhost:8080/',
        origin: 'http://localhost:8080',
      });

      expect(isFederatedModule).toBe(false);
    });

    it('is true when the host origin differs from PUBLIC_PATH_URL', async () => {
      const { isFederatedModule } = await loadModuleFederation({
        publicPathUrl: 'http://localhost:8080/',
        origin: 'http://localhost:3002',
      });

      expect(isFederatedModule).toBe(true);
    });
  });

  describe('safeImport', () => {
    it('returns an empty object without fetching when standalone', async () => {
      const { safeImport } = await loadModuleFederation({});
      const importFn = vi.fn();

      await expect(
        safeImport(importFn, 'connect/sharedStore'),
      ).resolves.toEqual({});
      expect(importFn).not.toHaveBeenCalled();
    });

    it('returns the module default export when federated import succeeds', async () => {
      const { safeImport } = await loadModuleFederation({
        publicPathUrl: 'http://localhost:8080',
        origin: 'http://localhost:3002',
      });
      const mountApp = vi.fn();
      const importFn = vi.fn().mockResolvedValue({ default: mountApp });

      await expect(safeImport(importFn, 'chats/main')).resolves.toBe(mountApp);
    });

    it('returns the module namespace when federated import has no default', async () => {
      const { safeImport } = await loadModuleFederation({
        publicPathUrl: 'http://localhost:8080',
        origin: 'http://localhost:3002',
      });
      const moduleNamespace = { useSharedStore: vi.fn() };
      const importFn = vi.fn().mockResolvedValue(moduleNamespace);

      await expect(safeImport(importFn, 'connect/sharedStore')).resolves.toBe(
        moduleNamespace,
      );
    });

    it('returns an empty object and reports to Sentry when federated import fails', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const { safeImport } = await loadModuleFederation({
        publicPathUrl: 'http://localhost:8080',
        origin: 'http://localhost:3002',
      });
      const error = new Error('remote unavailable');
      const importFn = vi.fn().mockRejectedValue(error);

      await expect(
        safeImport(importFn, 'connect/sharedStore'),
      ).resolves.toEqual({});

      expect(consoleError).toHaveBeenCalledWith(
        '[Module Federation] connect/sharedStore unavailable:',
        'remote unavailable',
      );
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { module_federation: true, import_path: 'connect/sharedStore' },
      });

      consoleError.mockRestore();
    });
  });
});
