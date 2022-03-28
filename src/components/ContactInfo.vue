<template>
  <aside class="contact-info">
    <header>
      <span>Informações do Contato</span>
      <span @click="$emit('close')" @keypress.enter="$emit('close')">
        <unnnic-icon-svg icon="close-1" size="sm" class="close-icon" />
      </span>
    </header>

    <div class="avatar">
      <unnnic-icon-svg icon="single-neutral-actions-1" size="xl" />
    </div>

    <span class="username">
      {{ chat.username }}
    </span>

    <span class="channel"> Canal: WhatsApp </span>

    <unnnic-select
      v-model="transferContactTo"
      label="Transferir atendimento"
      size="sm"
      class="channel-select"
    >
      <option value="suporte">Suporte</option>
      <option value="finance">Financeiro</option>
      <option value="customer_success">Customer success</option>
      <option value="management">Gerência</option>
    </unnnic-select>

    <unnnic-button text="Transferir" size="small" class="transfer-button" />
  </aside>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'ContactInfo',

  data: () => ({
    transferContactTo: '',
  }),

  computed: {
    ...mapState({
      chat: (state) => state.chats.activeChat,
    }),
  },
};
</script>

<style lang="scss" scoped>
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 1.5rem;
  max-height: 100%;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $unnnic-color-neutral-dark;

    .close-icon {
      cursor: pointer;
    }
  }

  .avatar {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 100%;
    min-height: 17.8125rem;
    background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
  }

  .username {
    font-size: 0.875rem;
    line-height: 1.375rem;
    color: $unnnic-color-neutral-dark;
  }

  .channel {
    font-size: 0.75rem;
    line-height: 1.25rem;
    color: $unnnic-color-neutral-dark;
  }

  .channel-select {
    margin-top: -0.5rem; /* the select label has a top margin of 8px */
  }

  .transfer-button {
    flex: none;
  }
}
</style>
