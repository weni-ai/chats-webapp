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
import { PREFERENCES_SOUND } from './components/PreferencesBar.vue';

const moment = require('moment');

class Notification {
  /**
   * @type {HTMLAudioElement}
   */
  #notification;

  constructor(soundName, type = 'wav') {
    this.#notification = new Audio(`/notifications/${soundName}.${type}`);
  }

  notify() {
    // if the user hadn't interacted with the page yet (click, scroll...),
    // the browser blocks the audio playing because is considered autoplay media
    if ((localStorage.getItem(PREFERENCES_SOUND) || 'yes') === 'no') {
      return;
    }

    this.#notification.play().catch(() => {});
  }
}

export default {
  name: 'App',

  async created() {
    this.handleLocale();
    setInterval(this.intervalPing, this.timerPing);
    const localStorageStatus = localStorage.getItem('statusAgent');
    if (!localStorageStatus || localStorageStatus === 'None') {
      localStorage.setItem('statusAgent', 'OFFLINE');
    }
    this.getStatus();
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
      activeRoom: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
      viewedAgent: (state) => state.dashboard.viewedAgent,
      nextQuickMessages: (state) => state.chats.quickMessages.nextQuickMessages,
      nextQuickMessagesShared: (state) => state.chats.quickMessagesShared.nextQuickMessagesShared,
    }),

    configsForInitializeWebSocket() {
      return [this.$store.state.config.token, this.$store.state.config.project];
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

  beforeMount() {
    this.loadQuickMessages();
    this.loadQuickMessagesShared();
    this.getUser();
  },

  methods: {
    initializeWebSocket() {
      const { token, project } = this.$store.state.config;
      const { viewedAgent } = this.$route.params;

      http.interceptors.request.use((config) => {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });

      if (viewedAgent) {
        this.ws = new WS(
          `${env(
            'CHATS_WEBSOCKET_URL',
          )}/manager/rooms?Token=${token}&project=${project}&user_email=${viewedAgent}`,
        );
      } else {
        this.ws = new WS(
          `${env('CHATS_WEBSOCKET_URL')}/agent/rooms?Token=${token}&project=${project}`,
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
      this.ws.on('msg.create', async (message) => {
        const { rooms, activeRoom } = this.$store.state.rooms;
        const findRoom = rooms.find((room) => room.uuid === message.room);

        this.$store.dispatch('rooms/bringRoomFront', findRoom);
        if (findRoom) {
          if (this.me.email === message.user?.email) {
            return;
          }

          const notification = new Notification('ping-bing');
          notification.notify();

          if (document.hidden) {
            sendWindowNotification({
              title: message.contact.name,
              message: message.text,
              image: message.media?.[0]?.url,
            });
          }

          const isCurrentRoom =
            this.$route.name === 'room' && this.$route.params.id === message.room;
          const isViewModeCurrentRoom =
            this.$route.params.viewedAgent && activeRoom?.uuid === message.room;

          if (isCurrentRoom || isViewModeCurrentRoom) {
            this.$store.dispatch('rooms/addMessage', message);
          }

          if (this.isAJson(message.text)) return;

          this.$store.dispatch('rooms/addNewMessagesByRoom', {
            room: message.room,
            message: {
              created_on: message.created_on,
              uuid: message.uuid,
              text: message.text,
            },
          });
        }
      });

      this.ws.on('rooms.create', (room) => {
        if (!!room.user && room.user.email !== this.me.email) return;

        this.$store.dispatch('rooms/addRoom', room);
        const notification = new Notification('select-sound');
        notification.notify();
      });

      this.ws.on('rooms.update', (room) => {
        if (!!room.user && room.user.email !== this.me.email) {
          this.handleLocale();
          // this.$router.replace({ name: 'home' });
        }

        if (
          !this.$store.state.rooms.rooms.find((alreadyInRoom) => alreadyInRoom.uuid === room.uuid)
        ) {
          this.$store.dispatch('rooms/addRoom', room);

          const notification = new Notification('select-sound');
          notification.notify();
        }

        const { viewedAgent } = this;
        this.$store.dispatch('rooms/updateRoom', {
          room,
          userEmail: this.me.email,
          routerReplace: () => this.$router.replace({ name: 'home' }),
          viewedAgentEmail: viewedAgent.email,
        });

        if (room.unread_msgs === 0) {
          this.$store.dispatch('rooms/resetNewMessagesByRoom', {
            room: room.uuid,
          });
        }
      });

      this.ws.on('rooms.close', (room) => {
        this.$store.dispatch('rooms/removeRoom', room.uuid);
      });

      this.ws.on('msg.update', (message) => {
        this.$store.dispatch('rooms/addMessage', message);
      });

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
