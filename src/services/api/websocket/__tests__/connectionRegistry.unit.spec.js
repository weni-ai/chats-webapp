import { describe, it, expect, beforeEach } from 'vitest';
import {
  setActiveConnection,
  getActiveConnection,
  isSocketOpen,
} from '@/services/api/websocket/connectionRegistry';

describe('connectionRegistry', () => {
  beforeEach(() => {
    setActiveConnection(null);
  });

  it('should store and return the active connection', () => {
    const connection = { ws: { ws: { readyState: WebSocket.OPEN } } };

    setActiveConnection(connection);

    expect(getActiveConnection()).toBe(connection);
  });

  it('should report socket open state based on readyState', () => {
    setActiveConnection({
      ws: { ws: { readyState: WebSocket.OPEN } },
    });
    expect(isSocketOpen()).toBe(true);

    setActiveConnection({
      ws: { ws: { readyState: WebSocket.CLOSED } },
    });
    expect(isSocketOpen()).toBe(false);
  });

  it('should report closed when there is no active connection', () => {
    expect(isSocketOpen()).toBe(false);
  });
});
