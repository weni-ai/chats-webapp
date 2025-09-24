import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleCustomStatusClose from '@/services/api/websocket/listeners/customStatus/close';

describe('CustomStatus close', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      updateUserStatusFromWebSocket: vi.fn(),
    };
  });

  describe('when user_disconnected_agent is present', () => {
    it('should call updateUserStatusFromWebSocket with OFFLINE status and user_disconnected_agent', () => {
      const content = {
        user_disconnected_agent: 'admin@example.com',
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'OFFLINE',
        'admin@example.com',
      );
      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledTimes(1);
    });

    it('should handle different user email formats', () => {
      const content = {
        user_disconnected_agent: 'supervisor@company.co.uk',
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'OFFLINE',
        'supervisor@company.co.uk',
      );
    });

    it('should handle user with numeric identifier', () => {
      const content = {
        user_disconnected_agent: 'user123@example.com',
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'OFFLINE',
        'user123@example.com',
      );
    });

    it('should ignore other properties in content and still work', () => {
      const content = {
        user_disconnected_agent: 'admin@example.com',
        status: 'ONLINE', // This should be ignored
        other_property: 'some_value',
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'OFFLINE',
        'admin@example.com',
      );
      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user_disconnected_agent is missing', () => {
    it('should not call updateUserStatusFromWebSocket', () => {
      const content = {};

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket with other properties present', () => {
      const content = {
        status: 'ONLINE',
        other_property: 'some_value',
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('when user_disconnected_agent is falsy', () => {
    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is empty string', () => {
      const content = {
        user_disconnected_agent: '',
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is null', () => {
      const content = {
        user_disconnected_agent: null,
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is undefined', () => {
      const content = {
        user_disconnected_agent: undefined,
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is false', () => {
      const content = {
        user_disconnected_agent: false,
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is 0', () => {
      const content = {
        user_disconnected_agent: 0,
      };

      handleCustomStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only user_disconnected_agent', () => {
      const content = {
        user_disconnected_agent: '   ',
      };

      handleCustomStatusClose(content, { app: mockApp });

      // Whitespace string is truthy, so it should call the function
      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'OFFLINE',
        '   ',
      );
    });
  });
});
