<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import http from '@/services/api/http';
import Profile from '@/services/api/resources/profile';
import WS from '@/services/api/websocket/setup';

const moment = require('moment');

export default {
  name: 'App',

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

  data() {
    return {
      ws: null,
      loading: false,
    };
  },

  computed: {
    ...mapState({
      activeRoom: (state) => state.chats.rooms.activeRoom,
      me: (state) => state.profile.me,
      viewedAgent: (state) => state.dashboard.viewedAgent,
      nextQuickMessages: (state) => state.chats.quickMessages.nextQuickMessages,
      nextQuickMessagesShared: (state) =>
        state.chats.quickMessagesShared.nextQuickMessagesShared,
      appToken: (state) => state.config.token,
      appProject: (state) => state.config.project,
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
        this.ws.reconnect();
      },
    },

    configsForInitializeWebSocket: {
      immediate: true,

      handler() {
        if (!this.configsForInitializeWebSocket.some((config) => !config)) {
          this.ws = new WS({ app: this });
          this.ws.connect();
        }
      },
    },
  },

  methods: {
    restoreLocalStorageUserStatus() {
      const userStatus = localStorage.getItem('statusAgent');
      if (!['OFFLINE', 'ONLINE'].includes(userStatus)) {
        localStorage.setItem('statusAgent', 'OFFLINE');
      }
      this.$store.dispatch('config/setStatus', userStatus);
    },

    async getUser() {
      const user = await Profile.me();
      this.$store.commit('profile/setMe', user);
    },

    async loadQuickMessages() {
      this.loading = true;
      try {
        await this.$store.dispatch('chats/quickMessages/getAll');
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
        await this.$store.dispatch('chats/quickMessagesShared/getAll');
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
      const projectUuid = this.$store.state.config.project;
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
        projectUuid: this.$store.state.config.project,
        status,
      });
      this.$store.state.config.status = connection_status;
      localStorage.setItem('statusAgent', connection_status);
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100vh;
}
</style>
