import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '@/store';
import { getProject, getToken } from '@/utils/config';
import Keycloak from '@/services/keycloak';
import routes from './routes';
import afterEachMiddlewares from './middlewares/afterEach';
import env from '@/utils/env';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  base: env('BASE_URL'),
  routes,
});

afterEachMiddlewares.forEach((middleware) => router.afterEach(middleware));

router.beforeEach(async (to, from, next) => {
  const authenticated = await Keycloak.isAuthenticated();
  if (authenticated) {
    const { token } = Keycloak.keycloak;
    await store.dispatch('config/setToken', token);

    if (to.hash.startsWith('#state=')) {
      next({ ...to, hash: '' });
    } else {
      next();
    }
  } else {
    Keycloak.keycloak.login();
  }
});

router.afterEach(() => {
  if (!store.state.config.token) {
    store.dispatch('config/setToken', getToken());
  }

  if (!store.state.config.project.uuid) {
    store.dispatch('config/setProjectUuid', getProject());
  }
});

export default router;
