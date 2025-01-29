import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useConfig } from '../config';
import Profile from '@/services/api/resources/profile';
import {
  setToken as setSessionToken,
  setProject as setSessionProjectUuid,
  setStatus as setSessionStatus,
} from '@/utils/config';

vi.mock('@/services/api/resources/profile', () => ({
  default: {
    status: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  setToken: vi.fn(),
  setProject: vi.fn(),
  setStatus: vi.fn(),
}));

describe('useConfig Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const config = useConfig();
    expect(config.token).toBe('');
    expect(config.project).toEqual({});
    expect(config.status).toBe('');
    expect(config.copilot).toEqual({
      active: false,
      customRulesActive: false,
      customRules: '',
    });
  });

  it('should set token and call setSessionToken', async () => {
    const config = useConfig();
    await config.setToken('test-token');

    expect(setSessionToken).toHaveBeenCalledWith('test-token');
    expect(config.token).toBe('test-token');
  });

  it('should set project UUID and call setSessionProjectUuid', async () => {
    const config = useConfig();
    await config.setProjectUuid('1234');

    expect(setSessionProjectUuid).toHaveBeenCalledWith('1234');
    expect(config.project.uuid).toBe('1234');
  });

  it('should set project object', async () => {
    const config = useConfig();
    const project = { uuid: '5678', name: 'Test Project' };

    await config.setProject(project);

    expect(config.project).toEqual(project);
  });

  it('should set status', () => {
    const config = useConfig();
    config.setStatus('online');

    expect(config.status).toBe('online');
  });

  it('should fetch and return project status', async () => {
    Profile.status.mockResolvedValue({ data: { connection_status: 'ONLINE' } });

    const config = useConfig();
    const status = await config.getStatus('1234');

    expect(status).toBe('ONLINE');
    expect(Profile.status).toHaveBeenCalledWith('1234');
  });

  it('should update status and call Profile.updateStatus', async () => {
    Profile.updateStatus.mockResolvedValue({
      data: { connection_status: 'OFFLINE' },
    });

    const config = useConfig();
    config.project.uuid = '1234';

    await config.updateStatus('offline');

    expect(Profile.updateStatus).toHaveBeenCalledWith({
      projectUuid: '1234',
      status: 'OFFLINE',
    });
    expect(config.status).toBe('OFFLINE');
    expect(setSessionStatus).toHaveBeenCalledWith('OFFLINE');
  });

  it('should throw error for invalid status type', async () => {
    const config = useConfig();
    await expect(config.updateStatus(123)).rejects.toThrow();
  });

  it('should throw error for invalid status value', async () => {
    const config = useConfig();
    await expect(config.updateStatus('busy')).rejects.toThrow();
  });

  it('should set Copilot active state', () => {
    const config = useConfig();
    config.setCopilotActive(true);

    expect(config.copilot.active).toBe(true);
  });

  it('should set Copilot custom rules active state', () => {
    const config = useConfig();
    config.setCopilotCustomRulesActive(true);

    expect(config.copilot.customRulesActive).toBe(true);
  });

  it('should set Copilot custom rules', () => {
    const config = useConfig();
    config.setCopilotCustomRules('rule-1');

    expect(config.copilot.customRules).toBe('rule-1');
  });
});
