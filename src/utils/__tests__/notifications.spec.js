import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendWindowNotification, requestPermission } from '../notifications';
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

const mockLogo = '/src/assets/weni-logo.svg';

describe('sendWindowNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should emit a notification event via iframessa if not on mobile', () => {
    vi.mocked(isMobile).mockReturnValue(false);

    sendWindowNotification({
      title: 'Test Title',
      message: 'Test Message',
    });

    expect(iframessa.emit).toHaveBeenCalledWith('notification', [
      'Test Title',
      {
        silent: true,
        badge: expect.stringContaining('weni-logo.svg'),
        icon: expect.stringContaining('weni-logo.svg'),
        body: 'Test Message',
        tag: 'Test Title',
      },
    ]);
  });

  it('should show a notification via serviceWorker on mobile with granted permission', async () => {
    vi.mocked(isMobile).mockReturnValue(true);
    Notification.permission = 'granted';

    sendWindowNotification({
      title: 'Mobile Notification',
      message: 'Mobile Message',
    });

    const serviceWorker = await navigator.serviceWorker.ready;
    expect(serviceWorker.showNotification).toHaveBeenCalledWith(
      'Mobile Notification',
      {
        silent: true,
        badge: expect.stringContaining('weni-logo.svg'),
        icon: expect.stringContaining('weni-logo.svg'),
        body: 'Mobile Message',
        tag: 'Mobile Notification',
      },
    );
  });

  it('should use image prefix for body when image is provided', () => {
    vi.mocked(isMobile).mockReturnValue(false);

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
        badge: expect.stringContaining('weni-logo.svg'),
        icon: expect.stringContaining('weni-logo.svg'),
        body: 'media\nTest Message',
        tag: 'Test Title',
      },
    ]);
  });
});

describe('requestPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Notification.permission = 'default';
  });

  it('should request permission if not granted and on mobile', () => {
    vi.mocked(isMobile).mockReturnValue(true);

    requestPermission();

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(iframessa.emit).toHaveBeenCalledWith(
      'notification.requestPermission',
    );
  });

  it('should not request permission if already granted', () => {
    vi.mocked(isMobile).mockReturnValue(true);
    Notification.permission = 'granted';

    requestPermission();

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(iframessa.emit).toHaveBeenCalledWith(
      'notification.requestPermission',
    );
  });

  it('should emit notification.requestPermission regardless of permission state', () => {
    vi.mocked(isMobile).mockReturnValue(false);

    requestPermission();

    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(iframessa.emit).toHaveBeenCalledWith(
      'notification.requestPermission',
    );
  });
});
