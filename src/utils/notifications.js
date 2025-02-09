import i18n from '@/plugins/i18n';
import iframessa from 'iframessa';
import logo from '../assets/weni-logo.svg';
import isMobile from 'is-mobile';

iframessa.register('chats');

export function sendWindowNotification({
  title = 'Notification',
  message = '',
  image = '',
}) {
  const options = {
    silent: true,
    badge: logo,
    icon: logo,
    body: image ? `${i18n.global.t('media')}\n${message}` : message,
    tag: title,
  };

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

  iframessa.emit('notification', [title, options]);
}

export function requestPermission() {
  if (isMobile() && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  iframessa.emit('notification.requestPermission');
}
