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
import QuickMessage from '@/services/api/resources/chats/quickMessage';
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
  },

  data() {
    return {
      ws: null,
      timerPing: 15000,
    };
  },

  computed: {
    ...mapState({
      activeRoom: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
    }),

    configsForInitializeWebSocket() {
      return [this.$store.state.config.token, this.$store.state.config.project];
    },
  },

  watch: {
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
      const { token, project } = this.$store.state.config;

      http.interceptors.request.use((config) => {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });

      this.loadQuickMessages();
      this.getUser();

      this.ws = new WS(
        `${env('CHATS_WEBSOCKET_URL')}/agent/rooms?Token=${token}&project=${project}`,
      );

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
      const response = await QuickMessage.all();
      this.$store.state.chats.quickMessages.messages = response.results;
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
      this.ws.on('msg.create', (message) => {
        const findRoom = this.$store.state.rooms.rooms.find((room) => room.uuid === message.room);
        this.$store.dispatch('rooms/bringRoomFront', findRoom);
        if (findRoom) {
          if (this.me.email === message.user?.email) {
            return;
          }
          const notification = new Notification('ping-bing');
          notification.notify();

          if (
            !this.$store.state.rooms.newMessagesByRoom[message.room] &&
            !(this.$route.name === 'room' && this.$route.params.id === message.room)
          ) {
            this.$set(this.$store.state.rooms.newMessagesByRoom, message.room, {
              messages: [],
            });
          } else if (this.$route.name === 'room' && this.$route.params.id === message.room) {
            this.$store.dispatch('rooms/addMessage', message);
          }

          if (this.$store.state.rooms.newMessagesByRoom[message.room]) {
            this.$store.state.rooms.newMessagesByRoom[message.room].messages.push({
              created_on: message.created_on,
              uuid: message.uuid,
              text: message.text,
            });
          }
        }
      });

      this.ws.on('rooms.create', (room) => {
        if (!!room.user && room.user.email !== this.me.email) return;

        this.$store.dispatch('rooms/addRoom', room);
        this.ws.send({
          type: 'method',
          action: 'join',
          content: { name: 'room', id: room.uuid },
        });
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

        this.$store.dispatch('rooms/updateRoom', { room, userEmail: this.me.email });
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

    async updateStatus(localStorageStatus) {
      const {
        data: { connection_status },
      } = await Profile.updateStatus({
        projectUuid: this.$store.state.config.project,
        status: localStorageStatus,
      });
      this.$store.state.config.status = connection_status;
      localStorage.setItem('statusAgent', connection_status);
    },

    intervalPing() {
      this.ws.send({
        type: 'ping',
      });
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100%;
}
</style>
