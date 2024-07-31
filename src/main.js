import { createApp } from 'vue';
import { createPinia } from 'pinia';

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
console.log('Remove this before merge at main');
app.directive(vMaskV3);

app.config.productionTip = false;

app.use(UnnnicSystem);

app.use(pinia);
app.use(router);
app.use(i18n);

app.mount('#app');
