import Vue from 'vue';
import VueRouter from 'vue-router';

import routes from './routes';
import afterEachMiddlewares from './middlewares/afterEach';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

afterEachMiddlewares.forEach((middleware) => router.afterEach(middleware));

export default router;
