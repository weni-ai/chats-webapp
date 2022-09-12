import store from '@/store';
import { setToken, setProject } from '@/utils/config';

const routes = [
  {
    path: '/loginexternal/:token',
    name: 'external.login',
    component: null,
    beforeEnter: async (to, from, next) => {
      let { token = '' } = to.params;
      token = token.replace('+', ' ');
      const { projectUuid = '' } = to.query;
      await store.dispatch('config/setToken', token);
      await store.dispatch('config/setProject', projectUuid);
      setToken(token);
      setProject(projectUuid);

      if (to.query.next) {
        next(to.query.next);
      } else {
        next({ name: 'home' });
      }
    },
  },
];

export default routes;
