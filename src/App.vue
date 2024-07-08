<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia';

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

import { getProject } from '@/utils/config';

import moment from 'moment';

export default {
  name: 'App',

  data() {
    return {
      ws: null,
      loading: false,
    };
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
    }),

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
          this.restoreLocalStorageUserStatus();
          this.getUserStatus();
          this.loadQuickMessages();
          this.loadQuickMessagesShared();
        }
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

  methods: {
    ...mapActions(useConfig, ['setStatus', 'setProject']),
    ...mapActions(useProfile, ['setMe']),
    ...mapActions(useQuickMessages, {
      getAllQuickMessages: 'getAll',
    }),
    ...mapActions(useQuickMessageShared, {
      getAllQuickMessagesShared: 'getAll',
    }),
    restoreLocalStorageUserStatus() {
      const userStatus = localStorage.getItem('statusAgent');
      if (!['OFFLINE', 'ONLINE'].includes(userStatus)) {
        localStorage.setItem('statusAgent', 'OFFLINE');
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
        localStorage.getItem('CHATS_USER_ONBOARDED') ||
        (await Profile.onboarded());
      if (onboarded) {
        localStorage.setItem('CHATS_USER_ONBOARDED', true);
        return;
      }

      this.$router.push({ name: 'onboarding.agent' });
    },

    async getUserStatus() {
      const userStatus = localStorage.getItem('statusAgent');
      const projectUuid = this.project.uuid;
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
      localStorage.setItem('statusAgent', connection_status);
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

    async wsReconnect() {
      this.ws.reconnect();
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100vh;
}
</style>
