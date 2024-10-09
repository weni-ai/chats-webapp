/* eslint-disable no-console */

import { register } from 'register-service-worker';
import env from './utils/env';

if (['production', 'staging'].includes(env('VITE_CHATS_ENVIRONMENT'))) {
  let reloadCount = 0;
  register('/service-worker.js', {
    ready() {
      console.info(
        'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB',
      );
    },
    registered() {
      console.info('Service worker has been registered.');
    },
    cached() {
      console.info('Content has been cached for offline use.');
    },
    updatefound() {
      console.info('New content is downloading.');
    },
    updated() {
      console.info('New content is available; please refresh.');
      if (reloadCount < 1) {
        reloadCount++;
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    },
    offline() {
      console.info(
        'No internet connection found. App is running in offline mode.',
      );
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    },
  });
}
