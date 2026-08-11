import {
  createRouter,
  createWebHistory,
  createMemoryHistory,
} from 'vue-router';
import isMobile from 'is-mobile';

import {
  getProject,
  getToken,
  setToken as setStorageToken,
} from '@/utils/config';
import Keycloak from '@/services/keycloak';
import routes from './routes';
import afterEachMiddlewares from './middlewares/afterEach';
import { isFederatedModule } from '@/utils/moduleFederation';

import { useConfig } from '@/store/modules/config';

// Federated: each mounted chats app gets its OWN router instance. The chats
// module is consumed twice by the host (live-desk + settings, distinct
// containers); a module-level singleton router would be shared between both
// apps, so navigating one (e.g. settings → `/settings`) would also move the
// other's view. A factory keeps each app's routing isolated.
//
// In federation mode history is in-memory so the chats router never touches the
// address bar — the connect host router is the single source of truth and chats
// navigations are mirrored back via `useFederatedModule`'s `setupRouterSync`.
export function createAppRouter() {
  const history = isFederatedModule
    ? createMemoryHistory()
    : createWebHistory(import.meta.env.BASE_URL);

  const router = createRouter({
    history,
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

  return router;
}
