/* eslint-disable no-console */

import { register } from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready(e) {
      console.info(
        'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB',
        e,
      );
    },
    registered(e) {
      console.info('Service worker has been registered.', e);

      /* do our magic */
      self.addEventListener('notificationclick', function (event) {
        let notification = event.notification;
        let action = event.action;

        if (action === 'close') {
          notification.close();
        } else {
          // eslint-disable-next-line no-undef
          clients.openWindow('https://www.google.com');
          notification.close();
        }
      });
      console.info('Added Event Listener for Notification Click');
    },
    cached(e) {
      console.info('Content has been cached for offline use.', e);
    },
    updatefound(e) {
      console.info('New content is downloading.', e);
    },
    updated(e) {
      console.info('New content is available; please refresh.', e);
    },
    offline(e) {
      console.info(
        'No internet connection found. App is running in offline mode.',
        e,
      );
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    },
  });
}
