import store from '@/store';
import { setToken, setProject } from '@/utils/config';

const routes = [
  {
    path: '/loginexternal/:token/:project',
    name: 'external.login',
    component: null,
    beforeEnter: async (to, from, next) => {
      const { token, project } = to.params;
      await store.dispatch('config/setToken', token.replace('+', ' '));
      await store.dispatch('config/setProject', project);
      setToken(token);
      setProject(project);

      if (to.query.next) {
        next(to.query.next);
      } else {
        next({ name: 'home' });
      }
    },
  },
];

export default routes;
