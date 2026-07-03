<template>
  <div id="app">
    <SocketAlertBanner v-if="showSocketAlertBanner" />
    <RouterView />
    <ModalOfflineAgent
      v-model="showModalOfflineAgent"
      :username="userWhoChangedStatus"
    />
    <ModalDarkModeIntro v-model:open="showDarkModeIntroModal" />
  </div>
</template>

<script>
import { unref } from 'vue';
import { mapActions, mapState } from 'pinia';

import SocketAlertBanner from './layouts/ChatsLayout/components/SocketAlertBanner.vue';
import ModalOfflineAgent from './components/ModalOfflineAgent.vue';
import ModalDarkModeIntro from './components/chats/ModalDarkModeIntro.vue';

import isMobile from 'is-mobile';

import http from '@/services/api/http';
import Profile from '@/services/api/resources/profile';
import Project from './services/api/resources/settings/project';
import WS from '@/services/api/websocket/setup';
import KeycloakService from '@/services/keycloak';
import * as notifications from '@/utils/notifications';

import { useConfig } from './store/modules/config';
import { useProfile } from './store/modules/profile';
import { useQuickMessages } from './store/modules/chats/quickMessages';
import { useQuickMessageShared } from './store/modules/chats/quickMessagesShared';
import { useRooms } from './store/modules/chats/rooms';
import { useDashboard } from './store/modules/dashboard';
import { useFeatureFlag } from './store/modules/featureFlag';
import { useTheme } from '@weni/unnnic-system';

import {
  applyRouteAwareTheme,
  notifyParentOfTheme,
  startLightThemeEnforcement,
  stopLightThemeEnforcement,
} from '@/utils/theme';
import { useQuickMessagesFeatureFlag } from '@/composables/useQuickMessagesFeatureFlag';

import initHotjar from '@/plugins/Hotjar';
import {
  getProject,
  setProject as setProjectLocalStorage,
} from '@/utils/config';

import { moduleStorage } from '@/utils/storage';
import { isFederatedModule } from '@/utils/moduleFederation';

import moment from 'moment';

export default {
  name: 'App',
  components: {
    SocketAlertBanner,
    ModalOfflineAgent,
    ModalDarkModeIntro,
  },
  inject: {
    chatsThemeMountContainer: { default: null },
    chatsForceLightTheme: { default: false },
    chatsThemeEnforcementActive: { default: null },
  },
  setup() {
    const queryString = window.location.href.split('?')[1];

    const { projectUuid } = Object.fromEntries(
      new URLSearchParams(queryString).entries(),
    );

    if (projectUuid) setProjectLocalStorage(projectUuid);

    const { resolvedTheme } = useTheme();
    return { resolvedTheme };
  },

  data() {
    return {
      ws: null,
      loading: false,
      showModalOfflineAgent: false,
      showModalRoomSummaryOnboarding: moduleStorage.getItem(
        'showModalRoomSummaryOnboarding',
        true,
      ),
      showDarkModeIntroModal: false,
      quickMessagesBootstrapDone: false,
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags', 'featureFlagsLoaded']),
    ...mapState(useRooms, ['activeRoom']),
    ...mapState(useProfile, ['me']),
    ...mapState(useDashboard, ['viewedAgent']),
    ...mapState(useQuickMessages, ['nextQuickMessages']),
    ...mapState(useQuickMessageShared, ['nextQuickMessagesShared']),
    ...mapState(useConfig, {
      userStatus: 'status',
      project: 'project',
      appToken: 'token',
      appProject: (store) => store.project.uuid,
      enableRoomSummary: (store) => store.project?.config?.has_chats_summary,
      socketStatus: 'socketStatus',
      disconnectedBy: 'disconnectedBy',
    }),

    socketRetryCount() {
      return this.ws?.reconnectAttempts || 0;
    },

    showSocketAlertBanner() {
      return (
        ['room', 'discussion', 'home'].includes(this.$route.name) &&
        ['closed', 'connecting'].includes(this.socketStatus) &&
        this.socketRetryCount >= (this.ws.MAX_RECONNECT_ATTEMPTS || 5)
      );
    },

    configsForInitializeWebSocket() {
      const { appToken, appProject } = this;

      return [appToken, appProject];
    },

    isQuickMessagesV2Enabled() {
      return useQuickMessagesFeatureFlag(this.featureFlags);
    },

    quickMessagesBootstrapReady() {
      return !!this.appToken && !!this.appProject && this.featureFlagsLoaded;
    },

    userWhoChangedStatus() {
      return this.disconnectedBy;
    },

    routeAwareTheme() {
      return [
        this.resolvedTheme,
        this.$route.path,
        this.shouldEnforceLightTheme,
      ];
    },

    shouldEnforceLightTheme() {
      if (!this.chatsForceLightTheme) {
        return false;
      }

      const activeRef = this.chatsThemeEnforcementActive;

      if (!activeRef) {
        return true;
      }

      return !!unref(activeRef);
    },
  },

  watch: {
    appToken: {
      immediate: true,
      handler(newAppToken) {
        if (!newAppToken) return;

        if (isMobile()) {
          if (this.appProject) this.initializeAppData(this.appProject);
        } else {
          this.getUser();
          this.getProject().then(() => {
            this.getProjectLanguage();
          });
          this.getFeatureFlags();
        }
      },
    },
    appProject: {
      immediate: true,
      handler(newAppProject) {
        if (!newAppProject || !this.appToken) return;

        if (isMobile()) {
          this.initializeAppData(newAppProject);
        } else {
          this.restoreSessionStorageUserStatus({
            projectUuid: newAppProject,
          });
          this.getUserStatus();
        }
      },
    },
    quickMessagesBootstrapReady: {
      immediate: true,
      handler(ready) {
        if (!ready || this.quickMessagesBootstrapDone) return;
        this.quickMessagesBootstrapDone = true;
        this.bootstrapQuickMessages();
      },
    },
    activeRoom: {
      handler(newRoom) {
        if (!this.isQuickMessagesV2Enabled) return;

        const sectorUuid = newRoom?.queue?.sector;
        if (!sectorUuid) return;

        this.loadPersonalQuickMessagesV2IfNeeded();
        this.loadQuickMessagesSharedBySectorIfNeeded(sectorUuid);
      },
    },
    'me.email': {
      async handler() {
        await this.getMeQueues();
        initHotjar(this.me.email);
      },
    },
    'viewedAgent.email': {
      handler() {
        this.wsReconnect();
      },
    },

    configsForInitializeWebSocket: {
      immediate: true,
      handler() {
        this.wsConnect();
      },
    },

    resolvedTheme(theme) {
      notifyParentOfTheme(theme);
    },

    // Reconcile the visual theme whenever the route or the resolved theme
    // changes. Light-only routes (e.g. `/settings`) always render in light
    // mode regardless of the persisted preference. Runs immediately so a
    // deep-link straight into a light-only route still paints correctly
    // even when the stored preference is dark.
    routeAwareTheme: {
      immediate: true,
      // Run after `useTheme()` (flush `pre`) so applyRouteAwareTheme wins the
      // final toggle on the mount container.
      flush: 'post',
      handler([theme, path, enforceLight]) {
        applyRouteAwareTheme(
          theme,
          path,
          this.chatsThemeMountContainer,
          enforceLight,
        );
      },
    },

    // `useTheme()` from unnnic keeps toggling `.dark` on the shared
    // `document.documentElement` while both live-desk and settings mounts are
    // alive. A one-shot clear loses the race, so install a MutationObserver
    // guard while the based (settings) mount is visible.
    shouldEnforceLightTheme: {
      immediate: true,
      handler(active, wasActive) {
        if (active && !wasActive) {
          startLightThemeEnforcement();
        } else if (!active && wasActive) {
          stopLightThemeEnforcement();
        }
      },
    },
  },

  beforeCreate() {
    http.interceptors.request.use((config) => {
      const token = KeycloakService.keycloak?.token || this.appToken;
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  },

  created() {
    this.handleLocale();
  },

  mounted() {
    notifications.requestPermission();
    this.announceThemeToParent();
    this.maybeShowDarkModeIntroModal();
  },

  beforeUnmount() {
    if (this.shouldEnforceLightTheme) {
      stopLightThemeEnforcement();
    }
  },

  methods: {
    ...mapActions(useConfig, [
      'setStatus',
      'setCustomStatus',
      'setProject',
      'setDisconnectedBy',
      'setSocketClosedOffline',
    ]),
    ...mapActions(useProfile, ['setMe', 'getMeQueues']),
    ...mapActions(useQuickMessages, {
      getAllQuickMessages: 'getAll',
      loadPersonalQuickMessagesV2IfNeeded: 'loadAllV2IfNeeded',
    }),
    ...mapActions(useQuickMessageShared, {
      getAllQuickMessagesShared: 'getAll',
      loadQuickMessagesSharedBySectorIfNeeded: 'loadBySectorIfNeeded',
    }),
    ...mapActions(useFeatureFlag, ['getFeatureFlags']),
    restoreSessionStorageUserStatus({ projectUuid }) {
      const userStatus = moduleStorage.getItem(
        `statusAgent-${projectUuid}`,
        '',
        { useSession: true },
      );
      if (!['OFFLINE', 'ONLINE'].includes(userStatus)) {
        moduleStorage.setItem(`statusAgent-${projectUuid}`, 'OFFLINE', {
          useSession: true,
        });
      }
      this.setStatus(userStatus);
    },

    async initializeAppData(projectUuid) {
      try {
        await Promise.all([
          this.getUser(),
          this.getProject(),
          this.getFeatureFlags(),
        ]);
      } catch (error) {
        console.error('[App] Failed to load initial data:', error);
      }

      this.restoreSessionStorageUserStatus({ projectUuid });

      try {
        await this.getUserStatus();
      } catch (error) {
        console.error('[App] Failed to get user status:', error);
      }
    },

    async getUser() {
      const user = await Profile.me();
      this.setMe(user);
    },

    async getProject() {
      const { data: project } = await Project.getInfo();
      this.setProject({
        ...project,
        uuid: this.appProject || getProject(),
      });
    },

    async getProjectLanguage() {
      const language = await Project.getProjectLanguage();
      this.setProject({ ...this.project, language });
    },

    bootstrapQuickMessages() {
      if (!this.isQuickMessagesV2Enabled) {
        this.loadQuickMessages();
        this.loadQuickMessagesShared();
        return;
      }

      // Under the v2 flag the live desk loads quick messages lazily (on room
      // entry / panel open). The legacy eager load is only kept for the
      // settings routes, which read the v1 store state directly.
      if (this.$route.path.startsWith('/settings')) {
        this.loadQuickMessages();
        this.loadQuickMessagesShared();
      }
    },

    async loadQuickMessages() {
      this.loading = true;
      try {
        await this.getAllQuickMessages();
      } finally {
        this.loading = false;
      }

      if (this.nextQuickMessages) {
        this.loadQuickMessages();
      }
    },

    async loadQuickMessagesShared() {
      this.loading = true;
      try {
        await this.getAllQuickMessagesShared();
      } finally {
        this.loading = false;
      }

      if (this.nextQuickMessagesShared) {
        this.loadQuickMessagesShared();
      }
    },

    handleLocale() {
      // Federation: locale is mirrored from the host shared store in main.js.
      // The parent postMessage handshake only works standalone/iframe.
      if (isFederatedModule) return;

      window.parent.postMessage({ event: 'getLanguage' }, '*');

      window.addEventListener('message', (ev) => {
        const message = ev.data;
        const isLocaleChangeMessage = message?.event === 'setLanguage';

        if (!isLocaleChangeMessage) return;

        const locale = (message?.language || 'en').toLowerCase(); // 'en', 'pt-br', 'es'

        moment.locale(locale);

        this.$i18n.locale = locale;
      });
    },

    announceThemeToParent() {
      notifyParentOfTheme(this.resolvedTheme);
    },

    // One-time dark mode intro modal. Storage flag is written immediately on
    // first display so the modal never reappears, even if the user closes the
    // tab before interacting.
    maybeShowDarkModeIntroModal() {
      if (moduleStorage.getItem('darkModeIntroSeen', false)) return;
      moduleStorage.setItem('darkModeIntroSeen', true);
      this.showDarkModeIntroModal = true;
    },

    async onboarding() {
      const onboarded =
        moduleStorage.getItem('userOnboarded', '', {
          useSession: true,
        }) || (await Profile.onboarded());
      if (onboarded) {
        moduleStorage.setItem('userOnboarded', true, {
          useSession: true,
        });
        return;
      }

      this.$router.push({ name: 'onboarding.agent' });
    },

    async getUserStatus() {
      const projectUuid = this.project.uuid;

      const userStatus = moduleStorage.getItem(
        `statusAgent-${projectUuid}`,
        '',
        {
          useSession: true,
        },
      );

      const {
        data: { connection_status: responseStatus },
      } = await Profile.status({
        projectUuid,
      });

      if (
        (userStatus === 'ONLINE' && responseStatus === 'OFFLINE') ||
        responseStatus === 'ONLINE'
      ) {
        this.updateUserStatus('ONLINE');
      }
    },

    async updateUserStatus(status) {
      const {
        data: { connection_status },
      } = await Profile.updateStatus({
        projectUuid: this.project.uuid,
        status,
      });
      useConfig().$patch({ status: connection_status });
      moduleStorage.setItem(
        `statusAgent-${this.project.uuid}`,
        connection_status,
        {
          useSession: true,
        },
      );
    },

    updateUserStatusFromWebSocket(
      status,
      disconnectedBy = '',
      isCustom = false,
    ) {
      moduleStorage.setItem(`statusAgent-${this.project.uuid}`, status, {
        useSession: true,
      });
      this.setSocketClosedOffline(true);
      this.setStatus(status);
      this.setDisconnectedBy(disconnectedBy);
      if (isCustom) {
        this.setCustomStatus('CUSTOM');
      }
      this.showModalOfflineAgent = true;
    },

    async wsConnect() {
      const isWSConnectionValid =
        !this.ws &&
        !this.configsForInitializeWebSocket.some((config) => !config);

      if (isWSConnectionValid) {
        this.ws = new WS({ app: this });
        this.ws.connect();
      }
    },

    async wsReconnect({ ignoreRetryCount } = {}) {
      this.ws.reconnect({ ignoreRetryCount });
    },

    updateOnboardingModal(key, value) {
      moduleStorage.setItem(key, value);
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100%;
}
</style>

<style>
/* This is necessary to prevent the alert from being behind some screen items such as svgs */
.alert-container {
  z-index: 99999999;
}
</style>
