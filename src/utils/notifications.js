import i18n from '@/plugins/i18n';
import logo from '../assets/weni-logo.svg';
import iframessa from 'iframessa';

iframessa.register('chats');

export function sendWindowNotification({ title = 'Notification', message = '', image = '' }) {
  const options = {
    silent: true,
    badge: logo,
    icon: logo,
    body: image ? `${i18n.t('media')}\n${message}` : message,
    tag: title,
  };

  iframessa.emit('notification', [title, options]);
}

export function requestPermission() {
  iframessa.emit('notification.requestPermission');
}
