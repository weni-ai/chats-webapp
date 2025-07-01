import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleStatus from '@/services/api/websocket/listeners/status/update';
import { useConfig } from '@/store/modules/config';

vi.mock('@/store/modules/config', () => ({
  useConfig: vi.fn(),
}));

describe('Status update', () => {
  let appMock;
  let configStoreMock;

  beforeEach(() => {
    appMock = {
      updateUserStatus: vi.fn(),
    };

    configStoreMock = {
      setStatus: vi.fn(),
      project: {
        uuid: 'test-project-uuid',
      },
    };

    useConfig.mockReturnValue(configStoreMock);

    sessionStorage.clear();
  });

  it('should call app.updateStatus if from is "system" and sessionStorageStatus differs from status', () => {
    sessionStorage.setItem('statusAgent-test-project-uuid', 'offline');
    const content = { from: 'system', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).toHaveBeenCalledWith('offline');
    expect(configStoreMock.setStatus).not.toHaveBeenCalled();
  });

  it('should call configStore.setStatus if from is "user" and sessionStorageStatus differs from status', () => {
    sessionStorage.setItem('statusAgent-test-project-uuid', 'offline');
    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).not.toHaveBeenCalled();
    expect(configStoreMock.setStatus).toHaveBeenCalledWith('online');
    expect(sessionStorage.getItem('statusAgent-test-project-uuid')).toBe(
      'online',
    );
  });

  it('should not update anything if sessionStorageStatus equals status', () => {
    sessionStorage.setItem('statusAgent-test-project-uuid', 'online');
    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).not.toHaveBeenCalled();
    expect(configStoreMock.setStatus).not.toHaveBeenCalled();
  });

  it('should set status in sessionStorage when from is "user" and status differs', () => {
    sessionStorage.setItem('statusAgent-test-project-uuid', 'offline');
    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(sessionStorage.getItem('statusAgent-test-project-uuid')).toBe(
      'online',
    );
  });

  it('should use fallback project UUID when configStore.project.uuid is not available', () => {
    // Set up fallback scenario
    configStoreMock.project.uuid = null;
    sessionStorage.setItem('WENICHATS_PROJECT_UUID', 'fallback-uuid');
    sessionStorage.setItem('statusAgent-fallback-uuid', 'offline');

    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).not.toHaveBeenCalled();
    expect(configStoreMock.setStatus).toHaveBeenCalledWith('online');
    expect(sessionStorage.getItem('statusAgent-fallback-uuid')).toBe('online');
  });
});
