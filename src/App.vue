<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import { ws } from '@/services/api/socket';
import Profile from '@/services/api/resources/profile';

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
    this.#notification.play().catch(() => {});
  }
}

export default {
  name: 'App',

  async created() {
    await this.getUser();

    ws.on('msg.create', (message) => {
      if (!this.activeRoom || this.me.email !== message.user?.email) {
        this.$store.dispatch('rooms/addMessage', message);
        const notification = new Notification('ping-bing');
        notification.notify();
      }
    });

    ws.on('rooms.create', (room) => {
      if (!!room.user && room.user.uuid !== this.me.uuid) return;

      this.$store.dispatch('rooms/addRoom', room);
      ws.send({
        type: 'method',
        action: 'join',
        content: { name: 'room', id: room.uuid },
      });
      const notification = new Notification('select-sound');
      notification.notify();
    });

    ws.on('rooms.update', (room) => {
      if (!!room.user && room.user.email !== this.me.email) return;
      this.$store.dispatch('rooms/updateRoom', { room, userEmail: this.me.email });
    });

    ws.on('msg.update', (message) => {
      this.$store.dispatch('rooms/addMessage', message);
    });
  },

  computed: {
    ...mapState({
      activeRoom: (state) => state.rooms.activeRoom,
      me: (state) => state.profile.me,
    }),
  },

  methods: {
    async getUser() {
      const user = await Profile.me();
      this.$store.commit('profile/setMe', user);
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100%;
}
</style>
