import store from '@/store';

const routes = [
  {
    path: '/loginexternal/:token/',
    name: 'external.login',
    component: null,
    beforeEnter: async (to, from, next) => {
      const { token } = to.params;
      await store.dispatch('auth/setToken', token.replace('+', ' '));

      if (to.query.next) {
        next(to.query.next);
      } else {
        next('/');
      }
    },
  },
];

export default routes;
