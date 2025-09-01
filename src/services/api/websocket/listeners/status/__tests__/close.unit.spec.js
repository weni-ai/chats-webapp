import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleStatus from '@/services/api/websocket/listeners/status/close';

describe('Status close', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log');
  });

  it('should log the content', () => {
    const content = { from: 'system', status: 'online' };

    handleStatus(content, { app: {} });

    expect(console.log).toHaveBeenCalledWith('status close', content);
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});
