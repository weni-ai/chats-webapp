import Vue from 'vue';
import LogRocket from 'logrocket';
import VMask from 'v-mask';

import App from './App.vue';
import i18n from './plugins/i18n';
import UnnnicSystem from './plugins/UnnnicSystem';
import router from './router';
import store from './store';
import env from './utils/env';

// import './utils/nilo';

import './styles/global.scss';

const LOGROCKET_ID = env('LOGROCKET_ID');
const LOGROCKET_PARENT_DOMAIN = env('LOGROCKET_PARENT_DOMAIN');

console.info('LogRocket Config: ', LOGROCKET_ID, LOGROCKET_PARENT_DOMAIN);

Vue.config.productionTip = false;

Vue.use(UnnnicSystem);
Vue.use(VMask);

new Vue({
  i18n,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

if (LOGROCKET_ID && LOGROCKET_PARENT_DOMAIN) {
  LogRocket.init(LOGROCKET_ID, {
    mergeIframes: true,
    parentDomain: LOGROCKET_PARENT_DOMAIN,
  });
}
