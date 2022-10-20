import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '@/store';
import { getProject, getToken } from '@/utils/config';
import routes from './routes';
import afterEachMiddlewares from './middlewares/afterEach';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

afterEachMiddlewares.forEach((middleware) => router.afterEach(middleware));

router.afterEach(() => {
  if (!store.state.config.token) {
    store.dispatch('config/setToken', getToken());
  }

  if (!store.state.config.project) {
    store.dispatch('config/setProject', getProject());
  }
});

export default router;
