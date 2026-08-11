import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HOST_BRIDGE_EVENT } from '../hostBridge';

async function loadHostBridge({
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

  return import('../hostBridge');
}

describe('hostBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PUBLIC_PATH_URL;
  });

  it('dispatches a chatsToHost CustomEvent in federated mode', async () => {
    const { emitToHost } = await loadHostBridge({
      publicPathUrl: 'http://localhost:8080',
      origin: 'http://localhost:3002',
    });
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
    const postMessage = vi.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    });

    emitToHost('changeOverlay', { data: true });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(HOST_BRIDGE_EVENT);
    expect(event.detail).toEqual({ event: 'changeOverlay', data: true });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('uses postMessage to the parent in standalone mode', async () => {
    const { emitToHost } = await loadHostBridge({
      publicPathUrl: 'http://localhost:8080',
      origin: 'http://localhost:8080',
    });
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
    const postMessage = vi.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    });

    emitToHost('redirect', { path: 'insights:init' });

    expect(postMessage).toHaveBeenCalledWith(
      { event: 'redirect', path: 'insights:init' },
      '*',
    );
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
