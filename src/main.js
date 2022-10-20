import Vue from 'vue';
import LogRocket from 'logrocket';
import VMask from 'v-mask';

import App from './App.vue';
import i18n from './plugins/i18n';
import router from './router';
import store from './store';
import env from './utils/env';

import './styles/global.scss';

LogRocket.init(env('LOGROCKET_ID'), {
  mergeIframes: true,
  parentDomain: env('LOGROCKET_PARENT_DOMAIN'),
});

Vue.config.productionTip = false;

Vue.use(VMask);

new Vue({
  i18n,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
