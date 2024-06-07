import { createApp } from 'vue';
import LogRocket from 'logrocket';
// import VMask from 'v-mask';

import App from './App.vue';
import i18n from './plugins/i18n';
import UnnnicSystem from './plugins/UnnnicSystem';
import router from './router';
import store from './store';
import env from './utils/env';
import '@weni/unnnic-system/dist/style.css';

import './registerServiceWorker';
import './styles/global.scss';

const LOGROCKET_ID = env('LOGROCKET_ID');
const LOGROCKET_PARENT_DOMAIN = env('LOGROCKET_PARENT_DOMAIN');

const app = createApp(App);

console.info('LogRocket Config: ', LOGROCKET_ID, LOGROCKET_PARENT_DOMAIN);

app.config.productionTip = false;

app.use(UnnnicSystem);
// app.use(VMask);

app.use(store);
app.use(router);
app.use(i18n);

app.mount('#app');

if (LOGROCKET_ID && LOGROCKET_PARENT_DOMAIN) {
  LogRocket.init(LOGROCKET_ID, {
    mergeIframes: true,
    parentDomain: LOGROCKET_PARENT_DOMAIN,
  });
}
