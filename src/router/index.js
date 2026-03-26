import { createRouter, createWebHistory } from 'vue-router';
import isMobile from 'is-mobile';

import {
  getProject,
  getToken,
  setToken as setStorageToken,
} from '@/utils/config';
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

router.beforeEach(async (to, from) => {
  if (!isMobile()) {
    return true;
  }

  const configStore = useConfig();

  if (from.name && configStore.token) {
    return true;
  }

  try {
    const authenticated = await Keycloak.isAuthenticated();

    if (authenticated) {
      const { token } = Keycloak.keycloak;
      setStorageToken(token);
      configStore.$patch({ token });

      if (to.hash.startsWith('#state=')) {
        return { ...to, hash: '' };
      }
      return true;
    }

    Keycloak.keycloak.login();
    return false;
  } catch (error) {
    Keycloak.keycloak.login();
    return false;
  }
});

router.afterEach(() => {
  const configStore = useConfig();
  if (!configStore.token) {
    configStore.setToken(getToken());
  }

  if (!isMobile() && !configStore.project.uuid) {
    configStore.setProjectUuid(getProject());
  }
});

export default router;
