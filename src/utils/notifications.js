import i18n from '@/plugins/i18n';
import logo from '../assets/weni-logo.svg';

/* eslint-disable no-new */
function supportsWindowNotification() {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notification');
    return false;
  }

  return true;
}

export function sendWindowNotification({ title = 'Notification', message = '', image = '' }) {
  if (Notification.permission === 'granted' && supportsWindowNotification()) {
    const options = {
      silent: true,
      badge: logo,
      icon: logo,
      body: image ? `${i18n.t('media')}\n${message}` : message,
      tag: title,
    };
    new Notification(title, options);
  }
}

export function requestPermission() {
  if (supportsWindowNotification && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}
