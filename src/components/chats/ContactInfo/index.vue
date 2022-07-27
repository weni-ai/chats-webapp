<template>
  <aside-slot-template
    class="contact-info"
    title="Informações do contato"
    @action="$listeners.close"
  >
    <section class="scrollable">
      <aside-slot-template-section>
        <section class="infos">
          <div class="avatar">
            <unnnic-icon-svg icon="single-neutral-actions-1" size="xl" />
          </div>

          <p class="username">
            {{ chat.username }}
          </p>

          <div class="connection-info">
            <p>{{ getLastViewText(chat.lastView) }}</p>
            <p>
              <span class="title"> {{ chat.channel }} </span>
              +55 47 98777 4756
            </p>
            <p>
              <span class="title"> Último contato </span>
              {{ getLastContactText(chat.lastContactDate) }}
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

      <aside-slot-template-section>
        <contact-media />
      </aside-slot-template-section>
    </section>
    <unnnic-modal
      text="Conversa transferida com sucesso!"
      :description="`O contato foi encaminhado para a fila do ${transferContactTo}`"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showSuccessfulTransferModal"
      @close="
        $store.commit('chats/setActiveChat', null),
          (showSuccessfulTransferModal = false),
          $router.replace('/')
      "
    />
  </aside-slot-template>
</template>

<script>
import { mapState } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import ContactMedia from './Media';

export default {
  name: 'ContactInfo',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
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
    getLastViewText(lastViewDate) {
      const today = new Date();
      const dateDifferenceInHours = this.getDatesDifferenceInHours(today, lastViewDate);

      if (dateDifferenceInHours >= 24) {
        const formattedDate = Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(lastViewDate);

        return `Online em ${formattedDate}`;
      }

      const dateDifferenceInMinutes = dateDifferenceInHours * 60;
      return dateDifferenceInMinutes > 60
        ? `Online há ${Number.parseInt(dateDifferenceInHours, 10)} horas`
        : `Online há ${Number.parseInt(dateDifferenceInMinutes, 10)} minutos`;
    },
    getDatesDifferenceInHours(a, b) {
      const differenceInMs = Math.abs(a - b);
      const oneHoursInMs = 60 * 60 * 1000;
      const differenceInHours = differenceInMs / oneHoursInMs;
      return differenceInHours;
    },
    getLastContactText(lastContactDate) {
      const today = new Date();
      const dateDifferenceInHours = this.getDatesDifferenceInHours(today, lastContactDate);

      if (dateDifferenceInHours >= 24) {
        const formattedDate = Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(lastContactDate);

        return `em ${formattedDate}`;
      }

      const dateDifferenceInMinutes = dateDifferenceInHours * 60;
      return dateDifferenceInMinutes > 60
        ? `há ${Number.parseInt(dateDifferenceInHours, 10)} horas`
        : `há ${Number.parseInt(dateDifferenceInMinutes, 10)} minutos`;
    },
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
  .scrollable {
    overflow-y: auto;
    height: 100%;
  }

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
