import { useConfigStore } from '@/store/modules/config';

const routes = [
  {
    path: '/loginexternal/:token',
    name: 'external.login',
    component: null,
    beforeEnter: async (to, from, next) => {
      let { token = '' } = to.params;
      token = token.replace('+', ' ').replace('Bearer ', '');
      const { projectUuid = '' } = to.query;
      const configStore = useConfigStore();
      await configStore.setToken(token);
      await configStore.setProjectUuid(projectUuid);
      if (to.query.next) {
        const parsedNext = to.query.next.replace(
          '/settings/chats',
          '/settings',
        );
        next(parsedNext);
      } else {
        next({ name: 'home' });
      }
    },
  },
];

export default routes;
