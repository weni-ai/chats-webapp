<template>
  <div class="container">
    <chat-group
      v-for="chatGroup in chatGroups"
      :key="chatGroup.name"
      :chat-group="chatGroup"
      :background-darkest="chatGroup.name === 'Fila'"
    />
  </div>
</template>

<script>
import chats from '@/data/chats.json';

import ChatGroup from './ChatGroup';

export default {
  name: 'ChatQueue',

  components: {
    ChatGroup,
  },

  data: () => ({
    chatGroups: chats,
  }),
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 1rem;
}
</style>
