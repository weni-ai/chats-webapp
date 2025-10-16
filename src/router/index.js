import {
  createRouter,
  createWebHistory,
  isNavigationFailure,
} from 'vue-router';
import isMobile from 'is-mobile';

import { getProject, getToken } from '@/utils/config';
import Keycloak from '@/services/keycloak';
import routes from './routes';
import afterEachMiddlewares from './middlewares/afterEach';
import env from '@/utils/env';

import { useConfig } from '@/store/modules/config';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  mode: 'history',
  base: env('BASE_URL'),
  routes,
});

afterEachMiddlewares.forEach((middleware) => router.afterEach(middleware));

router.beforeEach(async (to, from, next) => {
  if (!isMobile()) {
    next();
    return;
  }

  const configStore = useConfig();

  try {
    const authenticated = await Keycloak.isAuthenticated();

    console.log('authenticated', authenticated);

    if (authenticated) {
      const { token } = Keycloak.keycloak;
      await configStore.setToken(token);

      if (to.hash.startsWith('#state=')) {
        next({ ...to, hash: '' });
      } else {
        next();
      }
    } else {
      console.log('not authenticated, redirecting to login');
      next(false);
      Keycloak.keycloak.login();
    }
  } catch (error) {
    console.error('Error in authentication guard:', error);
    next(false);
    Keycloak.keycloak.login();
  }
});

router.afterEach((_, __, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure);
  }
  const configStore = useConfig();
  if (!configStore.token) {
    configStore.setToken(getToken());
  }

  if (!configStore.project.uuid) {
    configStore.setProjectUuid(getProject());
  }
});

export default router;
