<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { ws } from '@/services/api/socket';

export default {
  name: 'App',

  created() {
    ws.on('msg.create', (message) => {
      if (!this.activeRoom || this.activeRoom.user?.uuid !== message.user?.uuid)
        this.$store.dispatch('rooms/addMessage', message);
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
