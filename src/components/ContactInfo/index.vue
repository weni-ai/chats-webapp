<template>
  <aside class="contact-info">
    <section class="info">
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

      <unnnic-autocomplete
        v-model="transferContactSearch"
        :data="filteredTransferOptions"
        @choose="transferContactTo = $event"
        label="Transferir chat "
        placeholder="Selecione agente, fila ou setor"
        open-with-focus
        size="sm"
        highlight
        class="channel-select"
      />

      <unnnic-button
        text="Transferir"
        size="small"
        class="transfer-button"
        @click="transferContact"
        :type="!!transferContactTo ? 'primary' : 'terciary'"
        :disabled="!transferContactTo"
      />
    </section>

    <contact-media class="media" />

    <unnnic-modal
      text="Conversa transferida com sucesso!"
      :description="`O contato foi encaminhado para a fila do ${transferContactTo}`"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showSuccessfulTransferModal"
      @close="$store.commit('chats/setActiveChat', null), (showSuccessfulTransferModal = false)"
    />
  </aside>
</template>

<script>
import { mapState } from 'vuex';

import ContactMedia from './Media';

export default {
  name: 'ContactInfo',

  components: {
    ContactMedia,
  },

  data: () => ({
    transferOptions: [
      'Customer success',
      'Finanças',
      'Gerência',
      'Suporte Financeiro',
      { type: 'category', text: 'Financeiro' },
      'Juliano',
    ],
    transferContactSearch: '',
    transferContactTo: '',
    showSuccessfulTransferModal: false,
  }),

  computed: {
    ...mapState({
      chat: (state) => state.chats.activeChat,
    }),

    filteredTransferOptions() {
      const search = this.lowercase(this.transferContactSearch);

      if (!search) return this.transferOptions;

      const filteredOptions = this.transferOptions.filter(
        (option) =>
          option.type === 'category' || this.lowercase(option.text || option).includes(search),
      );

      // remove categories without options
      return filteredOptions.filter((option, index) => {
        if (option.type !== 'category') return true;

        const nextOption = filteredOptions[index + 1];

        if (!nextOption || nextOption.type === 'category') return false;

        return true;
      });
    },
  },

  methods: {
    lowercase(value) {
      return value.toString().toLowerCase();
    },
    transferContact() {
      this.$store.commit('chats/removeChat', this.chat);
      this.showSuccessfulTransferModal = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-info {
  height: 100%;
  max-height: 100%;
  padding-left: $unnnic-spacing-inset-xs;

  .info {
    display: flex;
    flex-direction: column;
    gap: 1rem;

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

  .media {
    margin-top: 1.5rem;
  }
}
</style>
