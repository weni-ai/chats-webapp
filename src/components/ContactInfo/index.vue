<template>
  <section class="contact-info">
    <aside-slot-template title="Informações do contato" @close="$listeners.close">
      <aside-slot-template-section>
        <section class="infos">
          <div class="avatar">
            <unnnic-icon-svg icon="single-neutral-actions-1" size="xl" />
          </div>

          <p class="username">
            {{ chat.username }}
          </p>

          <div class="connection-info">
            <p>Online há 10 minutos</p>
            <p>
              <span class="title"> WhatsApp </span>
              +55 47 98777 4756
            </p>
            <p>
              <span class="title"> Último contato </span>
              10/05/2022
            </p>
          </div>
        </section>
      </aside-slot-template-section>

      <aside-slot-template-section>
        <section class="transfer-section">
          <unnnic-autocomplete
            v-model="transferContactSearch"
            :data="filteredTransferOptions"
            @choose="transferContactTo = $event"
            placeholder="Selecione agente, fila ou setor"
            label="Transferir chat"
            open-with-focus
            size="sm"
            highlight
            class="channel-select"
          />

          <unnnic-button
            class="transfer__button"
            text="Transferir"
            size="small"
            :disabled="isTransferButtonDisabled"
            @click="transferContact"
          />
        </section>
      </aside-slot-template-section>
    </aside-slot-template>

    <unnnic-modal
      text="Conversa transferida com sucesso!"
      :description="`O contato foi encaminhado para a fila do ${transferContactTo}`"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showSuccessfulTransferModal"
      @close="$store.commit('chats/setActiveChat', null), (showSuccessfulTransferModal = false)"
    />
  </section>
</template>

<script>
import { mapState } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';

export default {
  name: 'ContactInfo',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
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

    isTransferButtonDisabled() {
      return !this.transferContactTo;
    },

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
  .infos {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;

    .avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: $unnnic-border-radius-lg;

      width: 100%;
      min-height: 17.8125rem;
      background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
    }

    .username {
      font-weight: $unnnic-font-weight-bold;
      font-size: $unnnic-font-size-title-sm;
      color: $unnnic-color-aux-purple;
    }

    .connection-info {
      display: flex;
      flex-direction: column;
      gap: $unnnic-spacing-stack-nano;

      font-size: $unnnic-font-size-body-md;
      color: $unnnic-color-neutral-cloudy;

      .title {
        font-weight: $unnnic-font-weight-bold;
      }
    }
  }

  .transfer-section {
    .transfer__button {
      margin-top: $unnnic-spacing-inline-sm;
      width: 100%;
    }
  }
}
</style>
