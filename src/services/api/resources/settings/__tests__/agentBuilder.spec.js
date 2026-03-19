import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import agentBuilder from '@/services/api/resources/settings/agentBuilder';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'test-project-uuid'),
}));

describe('agentBuilder service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('check', () => {
    it('should return agent_builder true when GET succeeds', async () => {
      http.get.mockResolvedValue({ data: {} });

      const result = await agentBuilder.check();

      expect(http.get).toHaveBeenCalledWith(
        '/project/test-project-uuid/human-support/',
      );
      expect(result).toEqual({ agent_builder: true });
    });

    it('should return agent_builder false when GET fails', async () => {
      http.get.mockRejectedValue(new Error('Not found'));

      const result = await agentBuilder.check();

      expect(result).toEqual({ agent_builder: false });
    });
  });

  describe('getAiTransferConfig', () => {
    it('should transform response to enabled/criteria format', async () => {
      http.get.mockResolvedValue({
        data: {
          human_support: true,
          human_support_prompt: 'Wait for an agent',
        },
      });

      const result = await agentBuilder.getAiTransferConfig();

      expect(http.get).toHaveBeenCalledWith(
        '/project/test-project-uuid/human-support/',
      );
      expect(result).toEqual({
        enabled: true,
        criteria: 'Wait for an agent',
      });
    });

    it('should default criteria to empty string when prompt is null', async () => {
      http.get.mockResolvedValue({
        data: {
          human_support: false,
          human_support_prompt: null,
        },
      });

      const result = await agentBuilder.getAiTransferConfig();

      expect(result).toEqual({
        enabled: false,
        criteria: '',
      });
    });
  });

  describe('updateAiTransferConfig', () => {
    it('should send both fields when provided', async () => {
      http.patch.mockResolvedValue({ data: {} });

      await agentBuilder.updateAiTransferConfig({
        enabled: true,
        criteria: 'New prompt',
      });

      expect(http.patch).toHaveBeenCalledWith(
        '/project/test-project-uuid/human-support/',
        {
          human_support: true,
          human_support_prompt: 'New prompt',
        },
      );
    });

    it('should send only human_support when criteria is undefined', async () => {
      http.patch.mockResolvedValue({ data: {} });

      await agentBuilder.updateAiTransferConfig({
        enabled: false,
      });

      expect(http.patch).toHaveBeenCalledWith(
        '/project/test-project-uuid/human-support/',
        { human_support: false },
      );
    });

    it('should send only human_support_prompt when enabled is undefined', async () => {
      http.patch.mockResolvedValue({ data: {} });

      await agentBuilder.updateAiTransferConfig({
        criteria: 'Updated prompt',
      });

      expect(http.patch).toHaveBeenCalledWith(
        '/project/test-project-uuid/human-support/',
        { human_support_prompt: 'Updated prompt' },
      );
    });
  });
});
