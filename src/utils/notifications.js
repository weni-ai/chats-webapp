import i18n from '@/plugins/i18n';
import isMobile from 'is-mobile';
import { emitToHost } from './hostBridge';
import { isFederatedModule } from '@/utils/moduleFederation';

function buildNotificationOptions({ message = '', image = '', title }) {
  return {
    silent: true,
    body: image ? `${i18n.global.t('media')}\n${message}` : message,
    // Same contact reuses the toast (latest message wins). Without
    // requireInteraction, Chrome auto-dismisses in a few seconds.
    tag: title,
    requireInteraction: true,
  };
}

export function sendWindowNotification({
  title = 'Notification',
  message = '',
  image = '',
}) {
  const options = buildNotificationOptions({ message, image, title });

  if (
    !isFederatedModule &&
    typeof Notification === 'function' &&
    Notification.permission === 'granted'
  ) {
    new Notification(title, options);
    return;
  }

  // Route via hostBridge so Connect owns the Notification API (same document
  // when federated; CustomEvent is a no-op with no host listener in standalone).
  emitToHost('chats:notification', { title, options });
}

export function requestPermission() {
  if (isMobile() && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }

  emitToHost('chats:notification-request-permission');
}
