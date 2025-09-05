import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleStatus from '@/services/api/websocket/listeners/status/update';
import { useConfig } from '@/store/modules/config';
import { moduleStorage } from '@/utils/storage';

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

    moduleStorage.clear({ useSession: true });
  });

  it('should call app.updateStatus if from is "system" and sessionStorageStatus differs from status', () => {
    moduleStorage.setItem('statusAgent-test-project-uuid', 'offline', {
      useSession: true,
    });
    const content = { from: 'system', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).toHaveBeenCalledWith('offline');
    expect(configStoreMock.setStatus).not.toHaveBeenCalled();
  });

  it('should call configStore.setStatus if from is "user" and sessionStorageStatus differs from status', () => {
    moduleStorage.setItem('statusAgent-test-project-uuid', 'offline', {
      useSession: true,
    });
    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).not.toHaveBeenCalled();
    expect(configStoreMock.setStatus).toHaveBeenCalledWith('online');
    expect(
      moduleStorage.getItem('statusAgent-test-project-uuid', null, {
        useSession: true,
      }),
    ).toBe('online');
  });

  it('should not update anything if sessionStorageStatus equals status', () => {
    moduleStorage.setItem('statusAgent-test-project-uuid', 'online', {
      useSession: true,
    });
    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).not.toHaveBeenCalled();
    expect(configStoreMock.setStatus).not.toHaveBeenCalled();
  });

  it('should set status in sessionStorage when from is "user" and status differs', () => {
    moduleStorage.setItem('statusAgent-test-project-uuid', 'offline', {
      useSession: true,
    });
    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(
      moduleStorage.getItem('statusAgent-test-project-uuid', null, {
        useSession: true,
      }),
    ).toBe('online');
  });

  it('should use fallback project UUID when configStore.project.uuid is not available', () => {
    // Set up fallback scenario
    configStoreMock.project.uuid = null;
    moduleStorage.setItem('projectUuid', 'fallback-uuid', { useSession: true });
    moduleStorage.setItem('statusAgent-fallback-uuid', 'offline', {
      useSession: true,
    });

    const content = { from: 'user', status: 'online' };

    handleStatus(content, { app: appMock });

    expect(appMock.updateUserStatus).not.toHaveBeenCalled();
    expect(configStoreMock.setStatus).toHaveBeenCalledWith('online');
    expect(
      moduleStorage.getItem('statusAgent-fallback-uuid', null, {
        useSession: true,
      }),
    ).toBe('online');
  });
});
