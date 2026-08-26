import i18n from '@/plugins/i18n';
import iframessa from 'iframessa';
import logo from '../assets/vtex-logo.svg';
import isMobile from 'is-mobile';
import { emitToHost } from './hostBridge';
import { isFederatedModule } from './moduleFederation';

iframessa.register('chats');

function buildNotificationOptions({ message = '', image = '', title }) {
  const options = {
    silent: true,
    body: image ? `${i18n.global.t('media')}\n${message}` : message,
    // Same contact reuses the toast (latest message wins). Without
    // requireInteraction, Chrome auto-dismisses in a few seconds.
    tag: title,
    requireInteraction: true,
  };

  // Federated: Connect overrides icon/badge with its same-origin VTEX
  // favicon. Passing the chats remote asset URL breaks the toast icon.
  if (!isFederatedModule) {
    options.badge = logo;
    options.icon = logo;
  }

  return options;
}

export function sendWindowNotification({
  title = 'Notification',
  message = '',
  image = '',
}) {
  const options = buildNotificationOptions({ message, image, title });

  if (
    isMobile() &&
    'serviceWorker' in navigator &&
    Notification.permission === 'granted'
  ) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    });

    return;
  }

  // Federated: same document/origin as Connect — route via hostBridge so the
  // host owns the Notification API (mirrors unread/theme).
  if (isFederatedModule) {
    emitToHost('chats:notification', { title, options });
    return;
  }

  // Iframe / standalone: host listens via iframessa (cross-origin).
  iframessa.emit('notification', [title, options]);
}

export function requestPermission() {
  if (isFederatedModule) {
    emitToHost('chats:notification-request-permission');
    return;
  }

  if (isMobile() && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  iframessa.emit('notification.requestPermission');
}
