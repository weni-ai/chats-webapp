import store from '@/store';
import { set } from '@/utils/token';

const routes = [
  {
    path: '/loginexternal/:token/',
    name: 'external.login',
    component: null,
    beforeEnter: async (to, from, next) => {
      const { token } = to.params;
      await store.dispatch('auth/setToken', token.replace('+', ' '));
      set(token);

      if (to.query.next) {
        next(to.query.next);
      } else {
        next({ name: 'home' });
      }
    },
  },
];

export default routes;
