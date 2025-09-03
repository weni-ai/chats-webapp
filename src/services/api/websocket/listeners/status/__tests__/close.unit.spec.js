import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleStatusClose from '@/services/api/websocket/listeners/status/close';

describe('Status close', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      updateUserStatusFromWebSocket: vi.fn(),
    };
  });

  describe('when user_disconnected_agent and status are present', () => {
    it('should call updateUserStatusFromWebSocket with status and user_disconnected_agent', () => {
      const content = {
        status: 'OFFLINE',
        user_disconnected_agent: 'admin@example.com',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'OFFLINE',
        'admin@example.com',
      );
      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledTimes(1);
    });

    it('should handle different status values', () => {
      const content = {
        status: 'ONLINE',
        user_disconnected_agent: 'supervisor@example.com',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).toHaveBeenCalledWith(
        'ONLINE',
        'supervisor@example.com',
      );
    });
  });

  describe('when user_disconnected_agent is missing', () => {
    it('should not call updateUserStatusFromWebSocket', () => {
      const content = {
        status: 'OFFLINE',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('when status is missing', () => {
    it('should not call updateUserStatusFromWebSocket', () => {
      const content = {
        user_disconnected_agent: 'admin@example.com',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('when both status and user_disconnected_agent are missing', () => {
    it('should not call updateUserStatusFromWebSocket', () => {
      const content = {};

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('when status is falsy but user_disconnected_agent is present', () => {
    it('should not call updateUserStatusFromWebSocket when status is empty string', () => {
      const content = {
        status: '',
        user_disconnected_agent: 'admin@example.com',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket when status is null', () => {
      const content = {
        status: null,
        user_disconnected_agent: 'admin@example.com',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('when user_disconnected_agent is falsy but status is present', () => {
    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is empty string', () => {
      const content = {
        status: 'OFFLINE',
        user_disconnected_agent: '',
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });

    it('should not call updateUserStatusFromWebSocket when user_disconnected_agent is null', () => {
      const content = {
        status: 'OFFLINE',
        user_disconnected_agent: null,
      };

      handleStatusClose(content, { app: mockApp });

      expect(mockApp.updateUserStatusFromWebSocket).not.toHaveBeenCalled();
    });
  });
});
