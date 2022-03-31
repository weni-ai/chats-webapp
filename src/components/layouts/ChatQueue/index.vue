<template>
  <div class="container">
    <unnnic-select
      v-if="isActiveChatsView"
      v-model="tag"
      placeholder="Pesquisar por tags"
      size="sm"
      @input="goToClosedChatsView"
    >
      <option value="doubts">Dúvidas</option>
      <option value="finance">Financeiro</option>
      <option value="help">Ajuda</option>
    </unnnic-select>
    <unnnic-button
      v-else
      text="Voltar para conversas"
      iconRight="keyboard-return-1"
      size="small"
      type="secondary"
      class="return-button"
      @click="$router.push('/')"
    />

    <chat-group
      v-for="chatGroup in chatGroups"
      :key="chatGroup.name"
      :chat-group="chatGroup"
      :background-darkest="chatGroup.name === 'Fila'"
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

  data: () => ({
    tag: '',
  }),

  computed: {
    ...mapState({
      chatGroups: (state) => state.data.chats,
    }),
    isActiveChatsView() {
      return this.$route.name === 'home';
    },
  },

  methods: {
    goToClosedChatsView() {
      const { tag } = this;
      const query = tag ? { tag } : null;

      this.$router.push({
        path: '/closed-chats',
        query,
      });
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

  .return-button {
    flex: none;
  }
}
</style>
