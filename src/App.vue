<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { ws } from '@/services/api/socket';

class Notification {
  /**
   * @type {HTMLAudioElement}
   */
  #notification;

  constructor(soundName, type = 'wav') {
    this.#notification = new Audio(`notifications/${soundName}.${type}`);
  }

  notify() {
    // if the user hadn't interacted with the page yet (click, scroll...),
    // the browser blocks the audio playing because is considered autoplay media
    this.#notification.play().catch(() => {});
  }
}

export default {
  name: 'App',

  created() {
    ws.on('msg.create', (message) => {
      if (!this.activeRoom || this.activeRoom.user?.uuid !== message.user?.uuid) {
        this.$store.dispatch('rooms/addMessage', message);
        const notification = new Notification('ping-bing');
        notification.notify();
      }
    });

    ws.on('room.create', () => {
      const notification = new Notification('select-sound');
      notification.notify();
    });

    ws.on('msg.update', (message) => {
      this.$store.dispatch('rooms/addMessage', message);
    });
  },

  computed: {
    activeRoom() {
      return this.$store.state.rooms.activeRoom;
    },
  },
};
</script>

<style lang="scss" scoped>
#app {
  height: 100%;
}
</style>
