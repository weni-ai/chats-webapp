import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HOST_BRIDGE_EVENT } from '../hostBridge';

async function loadHostBridge() {
  vi.resetModules();
  return import('../hostBridge');
}

describe('hostBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches a chatsToHost CustomEvent', async () => {
    const { emitToHost } = await loadHostBridge();
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent');

    emitToHost('changeOverlay', { data: true });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(HOST_BRIDGE_EVENT);
    expect(event.detail).toEqual({ event: 'changeOverlay', data: true });
  });

  it('includes event-specific payload fields', async () => {
    const { emitToHost } = await loadHostBridge();
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent');

    emitToHost('redirect', { path: 'insights:init' });

    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(HOST_BRIDGE_EVENT);
    expect(event.detail).toEqual({
      event: 'redirect',
      path: 'insights:init',
    });
  });
});
