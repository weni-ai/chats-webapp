import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as Sentry from '@sentry/vue';
import env from './utils/env';

import App from './App.vue';

import i18n from './plugins/i18n';
import UnnnicSystem from './plugins/UnnnicSystem';
import vMaskV3 from './plugins/vmask3';
import router from './router';

import '@weni/unnnic-system/dist/style.css';
import 'plyr/dist/plyr.css';

import './registerServiceWorker';
import './plugins/Hotjar.js';
import './styles/global.scss';

const app = createApp(App);
const pinia = createPinia();

app.directive(vMaskV3);

app.config.productionTip = false;

app.use(UnnnicSystem);

app.use(pinia);
app.use(router);
app.use(i18n);

console.log(env('SENTRY_DSN'));

Sentry.init({
  app,
  dsn: env('SENTRY_DSN'),
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: env('CHATS_ENVIRONMENT') === 'production' ? 1.0 : 0.5,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

app.mount('#app');
