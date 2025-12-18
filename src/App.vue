<template>
  <div id="app">
    <SocketAlertBanner v-if="showSocketAlertBanner" />
    <RouterView />
    <ModalOfflineAgent
      v-if="showModalOfflineAgent"
      v-model="showModalOfflineAgent"
      :username="userWhoChangedStatus"
    />
    <ModalOnboarding
      v-if="showModalOnboarding"
      v-model="showModalOnboarding"
    />
    <ModalRoomSummaryOnboarding
      v-if="enableRoomSummary"
      :modelValue="showModalRoomSummaryOnboarding"
      @update:model-value="
        (value) => {
          updateOnboardingModal('showModalRoomSummaryOnboarding', value);
          showModalRoomSummaryOnboarding = value;
        }
      "
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import SocketAlertBanner from './layouts/ChatsLayout/components/SocketAlertBanner.vue';
import ModalOfflineAgent from './components/ModalOfflineAgent.vue';
import ModalRoomSummaryOnboarding from './components/ModalRoomSummaryOnboarding.vue';
import ModalOnboarding from './components/ModalOnboarding.vue';

import http from '@/services/api/http';
import Profile from '@/services/api/resources/profile';
import Project from './services/api/resources/settings/project';
import WS from '@/services/api/websocket/setup';
import * as notifications from '@/utils/notifications';

import { useConfig } from './store/modules/config';
import { useProfile } from './store/modules/profile';
import { useQuickMessages } from './store/modules/chats/quickMessages';
import { useQuickMessageShared } from './store/modules/chats/quickMessagesShared';
import { useRooms } from './store/modules/chats/rooms';
import { useDashboard } from './store/modules/dashboard';
import { useFeatureFlag } from './store/modules/featureFlag';

import initHotjar from '@/plugins/Hotjar';

import { sub as subDateFns, isAfter as isAfterDateFns } from 'date-fns';

import {
  getProject,
  setProject as setProjectLocalStorage,
} from '@/utils/config';

import { moduleStorage } from '@/utils/storage';

import moment from 'moment';

export default {
  name: 'App',
  components: {
    SocketAlertBanner,
    ModalOfflineAgent,
    ModalRoomSummaryOnboarding,
    ModalOnboarding,
  },
  setup() {
    const queryString = window.location.href.split('?')[1];

    const { projectUuid } = Object.fromEntries(
      new URLSearchParams(queryString).entries(),
    );

    if (projectUuid) setProjectLocalStorage(projectUuid);
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
      showModalOnboarding: false,
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
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

    userWhoChangedStatus() {
      return this.disconnectedBy;
    },
  },

  watch: {
    appToken: {
      immediate: true,
      handler(newAppToken) {
        if (newAppToken) {
          this.getUser();
          this.getProject();
          this.getFeatureFlags();
        }
      },
    },
    appProject: {
      immediate: true,
      handler(newAppProject) {
        if (newAppProject && this.appToken) {
          this.restoreSessionStorageUserStatus({
            projectUuid: newAppProject,
          });
          this.getUserStatus();
          this.loadQuickMessages();
          this.loadQuickMessagesShared();
        }
      },
    },
    'me.email': {
      async handler() {
        this.handleShowOnboarding();
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
  },

  beforeCreate() {
    http.interceptors.request.use((config) => {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${this.appToken}`;
      return config;
    });
  },

  created() {
    this.handleLocale();
  },

  mounted() {
    notifications.requestPermission();
  },

  methods: {
    ...mapActions(useConfig, [
      'setStatus',
      'setCustomStatus',
      'setProject',
      'setDisconnectedBy',
    ]),
    ...mapActions(useProfile, ['setMe', 'getMeQueues']),
    ...mapActions(useQuickMessages, {
      getAllQuickMessages: 'getAll',
    }),
    ...mapActions(useQuickMessageShared, {
      getAllQuickMessagesShared: 'getAll',
    }),
    ...mapActions(useFeatureFlag, ['getFeatureFlags']),

    handleShowOnboarding() {
      const yesterday = subDateFns(new Date(), { days: 1 });
      const profileCreatedOn = new Date(this.me.created_on);
      const isAfter = isAfterDateFns(profileCreatedOn, yesterday);

      const showOnboarding =
        isAfter && !moduleStorage.getItem('userOnboarded', false);

      this.showModalOnboarding = showOnboarding;

      moduleStorage.setItem('userOnboarded', true);
    },
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
  height: 100vh;
}
</style>

<style>
/* This is necessary to prevent the alert from being behind some screen items such as svgs */
.alert-container {
  z-index: 99999999;
}
</style>
