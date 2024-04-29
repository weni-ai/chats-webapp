/* eslint-disable no-console */

import { register } from 'register-service-worker';

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready(e) {
      console.log(
        'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB',
        e,
      );
    },
    registered(e) {
      console.log('Service worker has been registered.', e);
    },
    cached(e) {
      console.log('Content has been cached for offline use.', e);
    },
    updatefound(e) {
      console.log('New content is downloading.', e);
    },
    updated(e) {
      console.log('New content is available; please refresh.', e);
    },
    offline(e) {
      console.log(
        'No internet connection found. App is running in offline mode.',
        e,
      );
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    },
  });
}
