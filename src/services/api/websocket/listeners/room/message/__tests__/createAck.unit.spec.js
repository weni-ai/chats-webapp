import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createAck from '@/services/api/websocket/listeners/room/message/createAck';
import {
  createPendingRequest,
  clearPendingRequests,
} from '@/services/api/websocket/pendingRequests';
import { SocketMessageCreateError } from '@/services/api/websocket/errors';

describe('msg.create ack listeners', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearPendingRequests();
  });

  afterEach(() => {
    clearPendingRequests();
    vi.useRealTimers();
  });

  describe('success', () => {
    it('should resolve the pending request when request_id matches', async () => {
      const promise = createPendingRequest('req-success');
      const content = {
        request_id: 'req-success',
        uuid: 'msg-uuid',
        text: 'Hello',
      };

      createAck.success(content);

      await expect(promise).resolves.toEqual(content);
    });

    it('should warn and ignore when request_id is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      createAck.success({ uuid: 'msg-uuid' });

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should reject the pending request with SocketMessageCreateError', async () => {
      const promise = createPendingRequest('req-error');

      createAck.error({
        request_id: 'req-error',
        error_code: 'room_closed',
        error_message: 'Closed rooms cannot receive messages',
      });

      await expect(promise).rejects.toMatchObject({
        name: 'SocketMessageCreateError',
        errorCode: 'room_closed',
        message: 'Closed rooms cannot receive messages',
      });
      await expect(promise).rejects.toBeInstanceOf(SocketMessageCreateError);
    });

    it('should warn and ignore when request_id is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      createAck.error({
        error_code: 'room_closed',
        error_message: 'Closed rooms cannot receive messages',
      });

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
