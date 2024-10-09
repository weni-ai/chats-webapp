/* eslint-disable no-console */

import { register } from 'register-service-worker';
import env from './utils/env';

if (['production', 'staging'].includes(env('VITE_CHATS_ENVIRONMENT'))) {
  let refreshing = false;

  // Listen for controlling service worker changing and reload the page
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  register('/service-worker.js', {
    ready() {
      console.info(
        'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB',
      );
    },
    registered(registration) {
      console.info('Service worker has been registered.');

      // Check for updates every hour
      setInterval(
        () => {
          registration.update();
        },
        1000 * 60,
      );
    },
    cached() {
      console.info('Content has been cached for offline use.');
    },
    updatefound() {
      console.info('New content is downloading.');
    },
    updated(registration) {
      console.info('New content is available; update in progress.');
      if (registration.waiting) {
        // When the update is ready, tell the new service worker to take control
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
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
