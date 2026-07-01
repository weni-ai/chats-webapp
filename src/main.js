import { createApp, watch } from 'vue';
import { createPinia } from 'pinia';
import * as Sentry from '@sentry/vue';
import moment from 'moment';
import env from './utils/env';

import App from './App.vue';

import i18n from './plugins/i18n';
import UnnnicSystem from './plugins/UnnnicSystem';
import vMaskV3 from './plugins/vmask3';
import { createAppRouter } from './router';
import { getJwtToken } from './utils/jwt';
import { useConfig } from './store/modules/config';
import { safeImport, isFederatedModule } from './utils/moduleFederation';

import '@weni/unnnic-system/dist/style.css';
import 'plyr/dist/plyr.css';

import './styles/global.scss';

// When consumed as a remote, `connect/sharedStore` resolves to the host's
// Pinia-backed shared store. In standalone/iframe mode the rspack alias points
// it at a stub that returns `null`, so `safeImport` yields `{}` and we fall
// back to the legacy token/postMessage handshake.
const { useSharedStore } = await safeImport(
  () => import('connect/sharedStore'),
  'connect/sharedStore',
);

const sharedStore = useSharedStore?.();

// The host stores raw account language values (e.g. `en-us`); chats i18n/moment
// use `en`, `pt-br`, `es`, `ro`. Normalize before applying.
function normalizeLocale(language) {
  const locale = (language || 'en').toLowerCase();
  return locale === 'en-us' ? 'en' : locale;
}

// Track the live app per container so a re-mount (HMR re-executing the exposed
// module, or a duplicate host mount call) tears down the previous instance
// instead of stacking a second chats UI inside the same container.
const mountedAppsByContainer = new Map();

export default async function mountChatsApp({
  containerId = 'app',
  initialRoute,
} = {}) {
  if (!isFederatedModule) {
    await getJwtToken();
    // The host owns the document-level service worker; only register it when
    // chats runs on its own origin (standalone / iframe).
    await import('./registerServiceWorker');
  }

  const app = createApp(App);
  const pinia = createPinia();
  // Per-mount router instance so the live-desk and settings apps (two separate
  // mounts of the same chats module) don't share routing state.
  const router = createAppRouter();

  app.directive(vMaskV3);

  app.config.productionTip = false;

  app.use(UnnnicSystem, { teleportTarget: `#${containerId}` });

  app.use(pinia);
  app.use(router);
  app.use(i18n);

  // Federated: mirror the host's auth token and current project into the chats
  // config store reactively. A one-time read would miss both the late initial
  // population (mount can run before the host sets the token) and the Keycloak
  // token refresh that the host performs every ~70s — either of which leaves
  // chats sending a stale/empty token and getting 401s.
  if (isFederatedModule && sharedStore) {
    const configStore = useConfig(pinia);

    watch(
      () => sharedStore.auth.token,
      (token) => {
        if (token) configStore.setToken(token);
      },
      { immediate: true },
    );

    watch(
      () => sharedStore.current.project.uuid,
      (projectUuid) => {
        if (projectUuid) configStore.setProjectUuid(projectUuid);
      },
      { immediate: true },
    );

    // Federated: the legacy getLanguage/setLanguage postMessage handshake can't
    // reach the host (same document, no iframe). Mirror the host's account
    // language from the shared store instead. `legacy: true` makes
    // `i18n.global.locale` the single source consumed everywhere (Accept-Language
    // headers, $i18n.locale watchers, moment dates).
    watch(
      () => sharedStore.user?.language,
      (language) => {
        const locale = normalizeLocale(language);
        i18n.global.locale = locale;
        moment.locale(locale);
      },
      { immediate: true },
    );
  }

  if (isFederatedModule && initialRoute) await router.replace(initialRoute);

  if (env('CHATS_ENVIRONMENT') === 'production') {
    Sentry.init({
      app,
      dsn: env('SENTRY_DSN'),
      integrations: [
        Sentry.browserTracingIntegration({ router }),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: env('CHATS_ENVIRONMENT'),
      initialScope: {
        tags: { federated: isFederatedModule },
      },
    });
  }

  const containerEl = document.getElementById(containerId);
  containerEl?.classList.add('chats-webapp');
  app.provide('chatsThemeMountContainer', containerEl);

  // Federated: mount into a private child node instead of the host-owned
  // container element. The host's virtual DOM owns `#${containerId}`; mounting
  // chats directly into it couples the two renderers — a host re-render or
  // teardown can detach nodes that chats still tracks, so chats' next
  // patch/unmount walks a broken sibling chain and throws
  // `Cannot read properties of null (reading 'nextSibling')`. A dedicated child
  // keeps both vdoms isolated.
  if (isFederatedModule && containerEl) {
    // Idempotent per container: discard any previous instance (e.g. left by an
    // HMR re-execution or a duplicate mount call) so we never stack two chats
    // UIs in the same container.
    const previousApp = mountedAppsByContainer.get(containerId);
    if (previousApp) {
      try {
        previousApp.unmount();
      } catch {
        // The previous DOM may already be detached by the host; ignore.
      }
      mountedAppsByContainer.delete(containerId);
    }
    containerEl.replaceChildren();

    const mountPoint = document.createElement('div');
    mountPoint.className = 'chats-webapp__root';
    mountPoint.style.height = '100%';
    mountPoint.style.width = '100%';
    containerEl.appendChild(mountPoint);
    app.mount(mountPoint);
    mountedAppsByContainer.set(containerId, app);

    // Wait for the initial navigation triggered by `app.mount` before returning
    // to the host — otherwise the host may push a route while the child router
    // is still resolving its default redirect.
    await router.isReady();
  } else if (isFederatedModule) {
    throw new Error(
      `[chats] Mount container #${containerId} not found — refusing to mount into the host root`,
    );
  } else {
    app.mount(`#${containerId}`);
  }

  return { app, router };
}

// Standalone / iframe: bootstrap immediately into the local `#app`.
// Federated: the host (connect) calls the exported `mountChatsApp` with its own
// container id. Never auto-mount when federated — doing so would mount chats on
// top of the host's `#app` root and break its DOM (nextSibling errors).
if (!isFederatedModule) {
  mountChatsApp();
}
