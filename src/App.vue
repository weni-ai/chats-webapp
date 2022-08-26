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
      const { user } = message;
      if (!user || !this.activeRoom || this.activeRoom.user.uuid !== user.uuid)
        this.$store.dispatch('rooms/newMessage', message);
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
