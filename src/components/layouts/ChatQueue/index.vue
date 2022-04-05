<template>
  <div class="container">
    <section class="chat-groups">
      <chat-group
        v-for="chatGroup in chatGroups"
        :key="chatGroup.name"
        :chat-group="chatGroup"
        :filled="chatGroup.name === 'Fila'"
        :disabled="disabled"
      />
    </section>

    <unnnic-button
      :text="isActiveChatsView ? 'Visualizar conversas encerradas' : 'Voltar para conversas'"
      iconRight="task-list-clock-1"
      type="secondary"
      size="small"
      @click="$router.push(isActiveChatsView ? '/closed-chats' : '/')"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import ChatGroup from './ChatGroup';

export default {
  name: 'ChatQueue',

  components: {
    ChatGroup,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    tag: '',
  }),

  computed: {
    ...mapState({
      chatGroups: (state) => state.chats.chats,
    }),
    isActiveChatsView() {
      return this.$route.name === 'home';
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;

  .chat-groups {
    flex: 1 1;

    display: flex;
    flex-direction: column;
    gap: 1rem;

    padding-right: 1rem;
    overflow-y: auto;
  }
}
</style>
