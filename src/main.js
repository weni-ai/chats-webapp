import { createApp } from 'vue';
import { createPinia } from 'pinia';
import LogRocket from 'logrocket';

import App from './App.vue';
import i18n from './plugins/i18n';
import UnnnicSystem from './plugins/UnnnicSystem';
import vMaskV3 from './plugins/vmask3';
import router from './router';

import env from './utils/env';
import '@weni/unnnic-system/dist/style.css';

import './registerServiceWorker';
import './styles/global.scss';

const LOGROCKET_ID = env('LOGROCKET_ID');
const LOGROCKET_PARENT_DOMAIN = env('LOGROCKET_PARENT_DOMAIN');

const app = createApp(App);
const pinia = createPinia();

app.directive(vMaskV3);

console.info('LogRocket Config: ', LOGROCKET_ID, LOGROCKET_PARENT_DOMAIN);

app.config.productionTip = false;

app.use(UnnnicSystem);

app.use(router);
app.use(i18n);
app.use(pinia);

app.mount('#app');

if (LOGROCKET_ID && LOGROCKET_PARENT_DOMAIN) {
  LogRocket.init(LOGROCKET_ID, {
    mergeIframes: true,
    parentDomain: LOGROCKET_PARENT_DOMAIN,
  });
}
