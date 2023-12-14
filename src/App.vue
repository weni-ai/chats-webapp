<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import http from '@/services/api/http';
import env from '@/utils/env';
import { WS } from '@/services/api/socket';
import Profile from '@/services/api/resources/profile';
import WebSocket from '@/services/api/websocket';

const moment = require('moment');

export default {
  name: 'App',

  created() {
    http.interceptors.request.use((config) => {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${this.appToken}`;
      return config;
    });

    this.handleLocale();
    setInterval(this.intervalPing, this.timerPing);
    const localStorageStatus = localStorage.getItem('statusAgent');
    if (!localStorageStatus || localStorageStatus === 'None') {
      localStorage.setItem('statusAgent', 'OFFLINE');
    }
  },

  async mounted() {
    this.getUser();
    this.getStatus();
    this.loadQuickMessages();
    this.loadQuickMessagesShared();
  },

  data() {
    return {
      ws: null,
      timerPing: 30000,
      loading: false,
    };
  },

  computed: {
    ...mapState({
      activeRoom: (state) => state.chats.rooms.activeRoom,
      me: (state) => state.profile.me,
      viewedAgent: (state) => state.dashboard.viewedAgent,
      nextQuickMessages: (state) => state.chats.quickMessages.nextQuickMessages,
      nextQuickMessagesShared: (state) => state.chats.quickMessagesShared.nextQuickMessagesShared,
      appToken: (state) => state.config.token,
      appProject: (state) => state.config.project,
    }),

    configsForInitializeWebSocket() {
      const { appToken, appProject } = this;

      return [appToken, appProject];
    },
  },

  watch: {
    'viewedAgent.email': {
      handler() {
        this.reconect();
      },
    },

    configsForInitializeWebSocket: {
      immediate: true,

      handler() {
        if (!this.configsForInitializeWebSocket.some((config) => !config)) {
          this.initializeWebSocket();
        }
      },
    },
  },

  methods: {
    initializeWebSocket() {
      const { appToken, appProject } = this;
      const { viewedAgent } = this.$route.params;

      if (viewedAgent) {
        this.ws = new WS(
          `${env(
            'CHATS_WEBSOCKET_URL',
          )}/manager/rooms?Token=${appToken}&project=${appProject}&user_email=${viewedAgent}`,
        );
      } else {
        this.ws = new WS(
          `${env('CHATS_WEBSOCKET_URL')}/agent/rooms?Token=${appToken}&project=${appProject}`,
        );
      }

      this.listeners();

      this.ws.ws.addEventListener('open', () => {
        this.$store.state.config.status = localStorage.getItem('statusAgent');
      });
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

        const locale = message?.language; // 'en-us', 'pt-br', 'es'

        moment.locale(locale);

        this.$i18n.locale = locale;
      });
    },
    async onboarding() {
      const onboarded = localStorage.getItem('CHATS_USER_ONBOARDED') || (await Profile.onboarded());
      if (onboarded) {
        localStorage.setItem('CHATS_USER_ONBOARDED', true);
        return;
      }

      this.$router.push({ name: 'onboarding.agent' });
    },

    listeners() {
      this.ws.on('msg.create', (message) =>
        WebSocket.room.message.create({
          message,
          store: this.$store,
          route: this.$route,
          me: this.me,
        }),
      );

      this.ws.on('discussion_msg.create', (message) =>
        WebSocket.discussion.message.create({
          message,
          store: this.$store,
          route: this.$route,
          me: this.me,
        }),
      );

      this.ws.on('rooms.create', (room) =>
        WebSocket.room.create({
          room,
          store: this.$store,
          me: this.me,
        }),
      );

      this.ws.on('discussions.create', (discussion) =>
        WebSocket.discussion.create({
          discussion,
          store: this.$store,
          me: this.me,
        }),
      );

      this.ws.on('rooms.update', (room) =>
        WebSocket.room.update({
          room,
          store: this.$store,
          router: this.$router,
          me: this.me,
          viewedAgent: this.viewedAgent,
        }),
      );

      this.ws.on('discussions.update', (discussion) =>
        WebSocket.discussion.update({
          discussion,
          store: this.$store,
          me: this.me,
        }),
      );

      this.ws.on('rooms.close', (room) =>
        WebSocket.room.delete({
          room,
          store: this.$store,
        }),
      );

      this.ws.on('discussions.close', (discussion) =>
        WebSocket.discussion.delete({
          discussion,
          store: this.$store,
          route: this.$route,
        }),
      );

      this.ws.on('msg.update', (message) =>
        WebSocket.room.message.update({
          message,
          store: this.$store,
          me: this.me,
        }),
      );

      this.ws.on('status.update', (content) => WebSocket.status.update({ content, app: this }));
    },
    async getStatus() {
      const localStorageStatus = localStorage.getItem('statusAgent');
      const response = await Profile.status({
        projectUuid: this.$store.state.config.project,
      });
      if (localStorageStatus === 'ONLINE' && response.data.connection_status === 'OFFLINE') {
        this.updateStatus('ONLINE');
      } else if (response.data.connection_status === 'ONLINE') {
        this.updateStatus('ONLINE');
      }
    },

    async updateStatus(status) {
      const {
        data: { connection_status },
      } = await Profile.updateStatus({
        projectUuid: this.$store.state.config.project,
        status,
      });
      this.$store.state.config.status = connection_status;
      localStorage.setItem('statusAgent', connection_status);
    },

    intervalPing() {
      if (this.ws.ws.readyState === this.ws.ws.OPEN) {
        this.ws.send({
          type: 'ping',
          message: {},
        });
      } else {
        this.reconect();
      }
    },

    reconect() {
      this.ws.ws.close();
      this.initializeWebSocket();

      const localStorageStatus = localStorage.getItem('statusAgent');
      this.updateStatus(localStorageStatus);
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100%;
}
</style>
