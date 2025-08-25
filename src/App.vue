<template>
  <div id="app">
    <SocketAlertBanner v-if="showSocketAlertBanner" />
    <RouterView />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import SocketAlertBanner from './layouts/ChatsLayout/components/SocketAlertBanner.vue';

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

import initHotjar from '@/plugins/Hotjar';
import {
  getProject,
  setProject as setProjectLocalStorage,
} from '@/utils/config';

import moment from 'moment';

export default {
  name: 'App',
  components: {
    SocketAlertBanner,
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
    };
  },

  computed: {
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
      socketStatus: 'socketStatus',
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
  },

  watch: {
    appToken: {
      immediate: true,
      handler(newAppToken) {
        if (newAppToken) {
          this.getUser();
          this.getProject();
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
    ...mapActions(useConfig, ['setStatus', 'setProject']),
    ...mapActions(useProfile, ['setMe', 'getMeQueues']),
    ...mapActions(useQuickMessages, {
      getAllQuickMessages: 'getAll',
    }),
    ...mapActions(useQuickMessageShared, {
      getAllQuickMessagesShared: 'getAll',
    }),
    restoreSessionStorageUserStatus({ projectUuid }) {
      const userStatus = sessionStorage.getItem(`statusAgent-${projectUuid}`);
      if (!['OFFLINE', 'ONLINE'].includes(userStatus)) {
        sessionStorage.setItem(`statusAgent-${projectUuid}`, 'OFFLINE');
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

        const locale = message?.language; // 'en', 'pt-br', 'es'

        moment.locale(locale);

        this.$i18n.locale = locale;
      });
    },

    async onboarding() {
      const onboarded =
        sessionStorage.getItem('CHATS_USER_ONBOARDED') ||
        (await Profile.onboarded());
      if (onboarded) {
        sessionStorage.setItem('CHATS_USER_ONBOARDED', true);
        return;
      }

      this.$router.push({ name: 'onboarding.agent' });
    },

    async getUserStatus() {
      const projectUuid = this.project.uuid;

      const userStatus = sessionStorage.getItem(`statusAgent-${projectUuid}`);

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
      sessionStorage.setItem(
        `statusAgent-${this.project.uuid}`,
        connection_status,
      );
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
