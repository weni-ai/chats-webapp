<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import http from '@/services/api/http';
import env from '@/utils/env';
import { sendWindowNotification } from '@/utils/notifications';
import { WS } from '@/services/api/socket';
import Profile from '@/services/api/resources/profile';
import SoundNotification from '@/services/api/websocket/soundNotification';
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

    isAJson(message) {
      try {
        JSON.parse(message);
        return true;
      } catch {
        return false;
      }
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

      this.ws.on('discussion_msg.create', async (message) => {
        const { discussions, activeDiscussion } = this.$store.state.chats.discussions;
        const findDiscussion = discussions.find(
          (discussion) => discussion.uuid === message.discussion,
        );

        // this.$store.dispatch('chats/rooms/bringRoomFront', findRoom);
        if (findDiscussion) {
          if (this.me.email === message.user?.email) {
            return;
          }

          const notification = new SoundNotification('ping-bing');
          notification.notify();

          if (document.hidden) {
            const { first_name, last_name } = message.user;
            sendWindowNotification({
              title: `${first_name} ${last_name}`,
              message: message.text,
              image: message.media?.[0]?.url,
            });
          }

          const isCurrentDiscussion =
            this.$route.name === 'discussion' &&
            this.$route.params.discussionId === message.discussion;
          const isViewModeCurrentDiscussion =
            this.$route.params.viewedAgent && activeDiscussion?.uuid === message.discussion;
          const shouldAddDiscussionMessage = isCurrentDiscussion || isViewModeCurrentDiscussion;

          if (shouldAddDiscussionMessage) {
            this.$store.dispatch('chats/discussionMessages/addDiscussionMessage', message);
          }

          const isJsonMessage = this.isAJson(message.text);
          if (shouldAddDiscussionMessage || isJsonMessage) {
            return;
          }

          this.$store.dispatch('chats/discussions/addNewMessagesByDiscussion', {
            discussion: message.discussion,
            message: {
              created_on: message.created_on,
              uuid: message.uuid,
              text: message.text,
            },
          });
        }
      });

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

      this.ws.on('discussions.update', (discussion) => {
        const { discussions, activeDiscussion } = this.$store.state.chats.discussions;
        const isNewDiscussion = !discussions.find(
          (mappedDiscussion) => mappedDiscussion.uuid === discussion.uuid,
        );

        if (isNewDiscussion && discussion.created_by !== this.me.email) {
          this.$store.dispatch('chats/discussions/addDiscussion', discussion);

          const notification = new SoundNotification('achievement-confirmation');
          notification.notify();
        }

        if (activeDiscussion?.uuid === discussion.uuid) {
          this.$store.dispatch('chats/discussions/setActiveDiscussion', discussion);
          this.$store.dispatch('chats/rooms/setActiveRoom', null);
        }

        if (
          discussion.added_agents.length >= 2 &&
          !discussion.added_agents.includes(this.me.email)
        ) {
          this.$store.dispatch('chats/discussions/removeDiscussion', discussion.uuid);
        }
      });

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

      this.ws.on('status.update', (info) => {
        const localStorageStatus = localStorage.getItem('statusAgent');
        if (localStorageStatus !== info.status) {
          if (info.from === 'system') {
            this.updateStatus(localStorageStatus);
          } else if (info.from === 'user') {
            this.$store.state.config.status = info.status;
            localStorage.setItem('statusAgent', info.status);
          }
        }
      });
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
