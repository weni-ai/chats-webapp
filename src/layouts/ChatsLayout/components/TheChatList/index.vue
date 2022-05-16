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
      :text="isActiveChatView ? 'Visualizar histórico' : 'Voltar para chats'"
      :iconRight="isActiveChatView ? 'task-list-clock-1' : 'keyboard-return'"
      type="secondary"
      size="small"
      @click="$router.push(isActiveChatView ? '/closed-chats' : '/')"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import ChatGroup from './ChatGroup';

export default {
  name: 'TheChatList',

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
    isActiveChatView() {
      return this.$route.name === 'home';
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;
  padding-bottom: $unnnic-spacing-inset-nano;

  .chat-groups {
    flex: 1 1;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;

    padding-right: $unnnic-spacing-inset-xs;
    overflow-y: auto;
  }
}
</style>
