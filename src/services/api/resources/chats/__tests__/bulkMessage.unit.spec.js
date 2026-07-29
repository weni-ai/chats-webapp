import { vi, describe, it, expect, beforeEach } from 'vitest';

import BulkMessageService from '../bulkMessage';
import http from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

describe('BulkMessage service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('countRooms', () => {
    it('should request rooms count with joined filters', async () => {
      http.get.mockResolvedValue({ data: { count: 42 } });

      const result = await BulkMessageService.countRooms({
        agents: ['agent@test.com'],
        queues: ['queue-1', 'queue-2'],
        status: ['ongoing', 'waiting'],
      });

      expect(http.get).toHaveBeenCalledWith('/msg/bulk-send/rooms/', {
        params: {
          project: 'mocked-project-id',
          agents: 'agent@test.com',
          queues: 'queue-1,queue-2',
          status: 'ongoing,waiting',
        },
      });
      expect(result).toEqual({ count: 42 });
    });

    it('should omit agents and queues when value is all', async () => {
      http.get.mockResolvedValue({ data: { count: 10 } });

      await BulkMessageService.countRooms({
        agents: ['all'],
        queues: ['all'],
        status: ['ongoing'],
      });

      expect(http.get).toHaveBeenCalledWith('/msg/bulk-send/rooms/', {
        params: {
          project: 'mocked-project-id',
          agents: undefined,
          queues: undefined,
          status: 'ongoing',
        },
      });
    });
  });

  describe('sendMessage', () => {
    it('should post message payload and return response data', async () => {
      http.post.mockResolvedValue({
        data: { status: 'PROCESSING', uuid: 'send-uuid' },
      });

      const result = await BulkMessageService.sendMessage({
        text: 'Hello',
        status: ['ongoing'],
        queues: ['queue-1'],
        agents: ['agent@test.com'],
      });

      expect(http.post).toHaveBeenCalledWith('/msg/bulk-send/', {
        project: 'mocked-project-id',
        text: 'Hello',
        status: ['ongoing'],
        queues: ['queue-1'],
        agents: ['agent@test.com'],
      });
      expect(result).toEqual({ status: 'PROCESSING', uuid: 'send-uuid' });
    });

    it('should send empty arrays when queues or agents is all', async () => {
      http.post.mockResolvedValue({
        data: { status: 'PROCESSING', uuid: 'send-uuid' },
      });

      await BulkMessageService.sendMessage({
        text: 'Hello',
        status: ['waiting'],
        queues: ['all'],
        agents: ['all'],
      });

      expect(http.post).toHaveBeenCalledWith('/msg/bulk-send/', {
        project: 'mocked-project-id',
        text: 'Hello',
        status: ['waiting'],
        queues: [],
        agents: [],
      });
    });
  });

  describe('getLastSentMessages', () => {
    it('should return recent history results', async () => {
      const messages = [
        { uuid: 'msg-1', text: 'Hi', sent_at: '2026-07-28T10:00:00Z' },
      ];
      http.get.mockResolvedValue({ data: { results: messages } });

      const result = await BulkMessageService.getLastSentMessages();

      expect(http.get).toHaveBeenCalledWith('/msg/bulk-send/recent-history/', {
        params: { project: 'mocked-project-id' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('checkIfHasShippingHistory', () => {
    it('should return history status flag', async () => {
      http.get.mockResolvedValue({ data: { status: true } });

      const result = await BulkMessageService.checkIfHasShippingHistory();

      expect(http.get).toHaveBeenCalledWith(
        '/msg/bulk-send/has-past-messages/',
        {
          params: { project: 'mocked-project-id' },
        },
      );
      expect(result).toBe(true);
    });
  });

  describe('getShippingHistory', () => {
    it('should request history with filters and pagination defaults', async () => {
      const response = {
        count: 1,
        results: [
          {
            contact: { name: 'Alice' },
            queue: { name: 'Support' },
            sent_by: { name: 'Agent' },
            date: '2026-07-28T10:00:00Z',
            status: 'SUCCESS',
          },
        ],
      };
      http.get.mockResolvedValue({ data: response });

      const result = await BulkMessageService.getShippingHistory({
        start_date: '2026-07-28',
        end_date: '2026-07-28',
        sender: 'agent@test.com',
        status: 'SUCCESS',
      });

      expect(http.get).toHaveBeenCalledWith('/msg/bulk-send/history/', {
        params: {
          project: 'mocked-project-id',
          start_date: '2026-07-28',
          end_date: '2026-07-28',
          sender: 'agent@test.com',
          status: 'SUCCESS',
          offset: 0,
          limit: 5,
        },
      });
      expect(result).toEqual(response);
    });

    it('should respect custom offset and limit', async () => {
      http.get.mockResolvedValue({ data: { count: 0, results: [] } });

      await BulkMessageService.getShippingHistory({
        offset: 10,
        limit: 20,
      });

      expect(http.get).toHaveBeenCalledWith('/msg/bulk-send/history/', {
        params: expect.objectContaining({
          offset: 10,
          limit: 20,
        }),
      });
    });
  });
});
