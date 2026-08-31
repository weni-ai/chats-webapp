import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '@/plugins/i18n';
import isMobile from 'is-mobile';

vi.mock('@/plugins/i18n', () => ({
  default: {
    global: { t: vi.fn((key) => key) },
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

async function loadNotifications() {
  vi.resetModules();

  const notifications = await import('../notifications');
  const { emitToHost } = await import('@/utils/hostBridge');

  return { ...notifications, emitToHost };
}

describe('sendWindowNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Notification.permission = 'default';
  });

  it('should emit a notification event via hostBridge if not on mobile', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { sendWindowNotification, emitToHost } = await loadNotifications();

    sendWindowNotification({
      title: 'Test Title',
      message: 'Test Message',
    });

    expect(emitToHost).toHaveBeenCalledWith('chats:notification', {
      title: 'Test Title',
      options: {
        silent: true,
        body: 'Test Message',
        tag: 'Test Title',
        requireInteraction: true,
      },
    });
  });

  it('should show a notification via serviceWorker on mobile with granted permission', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    Notification.permission = 'granted';
    const { sendWindowNotification, emitToHost } = await loadNotifications();

    sendWindowNotification({
      title: 'Mobile Notification',
      message: 'Mobile Message',
    });

    const serviceWorker = await navigator.serviceWorker.ready;
    expect(serviceWorker.showNotification).toHaveBeenCalledWith(
      'Mobile Notification',
      {
        silent: true,
        body: 'Mobile Message',
        tag: 'Mobile Notification',
        requireInteraction: true,
      },
    );
    expect(emitToHost).not.toHaveBeenCalled();
  });

  it('should use image prefix for body when image is provided', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { sendWindowNotification, emitToHost } = await loadNotifications();

    sendWindowNotification({
      title: 'Test Title',
      message: 'Test Message',
      image: 'Test Image',
    });

    expect(i18n.global.t).toHaveBeenCalledWith('media');
    expect(emitToHost).toHaveBeenCalledWith('chats:notification', {
      title: 'Test Title',
      options: {
        silent: true,
        body: 'media\nTest Message',
        tag: 'Test Title',
        requireInteraction: true,
      },
    });
  });
});

describe('requestPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Notification.permission = 'default';
  });

  it('should request permission if not granted and on mobile', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    const { requestPermission, emitToHost } = await loadNotifications();

    requestPermission();

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(emitToHost).toHaveBeenCalledWith(
      'chats:notification-request-permission',
    );
  });

  it('should not request browser permission if already granted on mobile', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    Notification.permission = 'granted';
    const { requestPermission, emitToHost } = await loadNotifications();

    requestPermission();

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(emitToHost).toHaveBeenCalledWith(
      'chats:notification-request-permission',
    );
  });

  it('should emit via hostBridge regardless of permission state when not on mobile', async () => {
    vi.mocked(isMobile).mockReturnValue(false);
    const { requestPermission, emitToHost } = await loadNotifications();

    requestPermission();

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(emitToHost).toHaveBeenCalledWith(
      'chats:notification-request-permission',
    );
  });
});
