import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '@/plugins/i18n';
import iframessa from 'iframessa';
import isMobile from 'is-mobile';

vi.mock('@/plugins/i18n', () => ({
  default: {
    global: { t: vi.fn((key) => key) },
  },
}));

vi.mock('iframessa', () => ({
  default: {
    emit: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('is-mobile', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils/hostBridge', () => ({
  emitToHost: vi.fn(),
}));

Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn(() => Promise.resolve('granted')),
  },
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve({
        showNotification: vi.fn(),
      }),
    },
  },
  writable: true,
});

const logoMatcher = expect.stringContaining('vtex-logo.svg');

async function loadNotifications({ federated = false } = {}) {
  vi.resetModules();

  vi.doMock('@/utils/moduleFederation', () => ({
    isFederatedModule: federated,
  }));

  const notifications = await import('../notifications');
  const { emitToHost } = await import('@/utils/hostBridge');

  return { ...notifications, emitToHost };
}

describe('sendWindowNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Notification.permission = 'default';
  });

  it('should emit a notification event via iframessa if not on mobile', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { sendWindowNotification, emitToHost } = await loadNotifications();

    sendWindowNotification({
      title: 'Test Title',
      message: 'Test Message',
    });

    expect(iframessa.emit).toHaveBeenCalledWith('notification', [
      'Test Title',
      {
        silent: true,
        badge: logoMatcher,
        icon: logoMatcher,
        body: 'Test Message',
        tag: 'Test Title',
        requireInteraction: true,
      },
    ]);
    expect(emitToHost).not.toHaveBeenCalled();
  });

  it('should show a notification via serviceWorker on mobile with granted permission', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    Notification.permission = 'granted';
    const { sendWindowNotification } = await loadNotifications();

    sendWindowNotification({
      title: 'Mobile Notification',
      message: 'Mobile Message',
    });

    const serviceWorker = await navigator.serviceWorker.ready;
    expect(serviceWorker.showNotification).toHaveBeenCalledWith(
      'Mobile Notification',
      {
        silent: true,
        badge: logoMatcher,
        icon: logoMatcher,
        body: 'Mobile Message',
        tag: 'Mobile Notification',
        requireInteraction: true,
      },
    );
  });

  it('should use image prefix for body when image is provided', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { sendWindowNotification } = await loadNotifications();

    sendWindowNotification({
      title: 'Test Title',
      message: 'Test Message',
      image: 'Test Image',
    });

    expect(i18n.global.t).toHaveBeenCalledWith('media');
    expect(iframessa.emit).toHaveBeenCalledWith('notification', [
      'Test Title',
      {
        silent: true,
        badge: logoMatcher,
        icon: logoMatcher,
        body: 'media\nTest Message',
        tag: 'Test Title',
        requireInteraction: true,
      },
    ]);
  });

  it('should emit via hostBridge when federated', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { sendWindowNotification, emitToHost } = await loadNotifications({
      federated: true,
    });

    sendWindowNotification({
      title: 'Federated Title',
      message: 'Federated Message',
    });

    expect(emitToHost).toHaveBeenCalledWith('chats:notification', {
      title: 'Federated Title',
      options: {
        silent: true,
        body: 'Federated Message',
        tag: 'Federated Title',
        requireInteraction: true,
      },
    });
    expect(iframessa.emit).not.toHaveBeenCalled();
  });
});

describe('requestPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Notification.permission = 'default';
  });

  it('should request permission if not granted and on mobile', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    const { requestPermission } = await loadNotifications();

    requestPermission();

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(iframessa.emit).toHaveBeenCalledWith(
      'notification.requestPermission',
    );
  });

  it('should not request permission if already granted', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    Notification.permission = 'granted';
    const { requestPermission } = await loadNotifications();

    requestPermission();

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(iframessa.emit).toHaveBeenCalledWith(
      'notification.requestPermission',
    );
  });

  it('should emit notification.requestPermission regardless of permission state', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { requestPermission } = await loadNotifications();

    requestPermission();

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(iframessa.emit).toHaveBeenCalledWith(
      'notification.requestPermission',
    );
  });

  it('should request permission via hostBridge when federated', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { requestPermission, emitToHost } = await loadNotifications({
      federated: true,
    });

    requestPermission();

    expect(emitToHost).toHaveBeenCalledWith(
      'chats:notification-request-permission',
    );
    expect(iframessa.emit).not.toHaveBeenCalled();
    expect(Notification.requestPermission).not.toHaveBeenCalled();
  });
});
