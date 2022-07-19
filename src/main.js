import Vue from 'vue';
import LogRocket from 'logrocket';

import App from './App.vue';
import i18n from './plugins/i18n';
import router from './router';
import store from './store';
import env from './utils/env';

import './styles/global.scss';

LogRocket.init('lqshel/test-weni-webapp', {
  mergeIframes: true,
  parentDomain: env('VUE_APP_PARENT_DOMAIN'),
});

Vue.config.productionTip = false;

new Vue({
  i18n,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
