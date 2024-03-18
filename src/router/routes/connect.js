// eslint-disable-next-line import/no-cycle
import store from '@/store';

const routes = [
  {
    path: '/loginexternal/:token',
    name: 'external.login',
    component: null,
    beforeEnter: async (to, from, next) => {
      let { token = '' } = to.params;
      token = token.replace('+', ' ').replace('Bearer ', '');
      const { projectUuid = '' } = to.query;
      await store.dispatch('config/setToken', token);
      await store.dispatch('config/setProject', projectUuid);

      if (to.query.next) {
        const parsedNext = to.query.next.replace('/settings/chats', '/settings');
        next(parsedNext);
      } else {
        next({ name: 'home' });
      }
    },
  },
];

export default routes;
