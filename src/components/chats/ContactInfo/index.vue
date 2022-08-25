<template>
  <aside-slot-template
    class="contact-info"
    :title="$t('contact_information')"
    @action="$listeners.close"
  >
    <section class="scrollable">
      <aside-slot-template-section>
        <section class="infos">
          <div class="avatar">
            <unnnic-icon-svg icon="single-neutral-actions-1" size="xl" />
          </div>

          <p class="username">
            {{ room.contact.name }}
          </p>

          <div class="connection-info">
            <p v-if="room.contact.status === 'online'">Online</p>
            <p v-else>{{ getLastTimeOnlineText(room.contact.last_interaction || new Date()) }}</p>
            <p v-for="[field, value] of Object.entries(room.contact.custom_fields)" :key="field">
              <span class="title"> {{ field }} </span>
              {{ value }}
            </p>
            <p>
              {{
                getLastContactText(
                  room.contact.last_interaction || new Date(Date.now() - 10 * 60 * 1000),
                )
              }}
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
            :placeholder="$t('select_agent_line_or_department')"
            :label="$t('chats.transfer')"
            open-with-focus
            size="sm"
            highlight
            class="channel-select"
          />

          <unnnic-button
            class="transfer__button"
            :text="$t('transfer')"
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
      :text="$t('successfully_transferred_chat')"
      :description="$t('successfully_transferred_contact_to.line', { name: transferContactTo })"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showSuccessfulTransferModal"
      @close="
        $store.commit('chats/setActiveChat', null),
          (showSuccessfulTransferModal = false),
          navigate('home')
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
      room: (state) => state.rooms.activeRoom,
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
    navigate(name) {
      this.$router.replace({ name });
    },
    getLastTimeOnlineText(lastView) {
      const today = new Date();
      const lastViewDate = new Date(lastView);
      const dateDifferenceInHours = this.getDatesDifferenceInHours(today, lastViewDate);

      if (dateDifferenceInHours >= 24) {
        const formattedDate = Intl.DateTimeFormat(this.$i18n.locale, {
          dateStyle: 'short',
        }).format(lastViewDate);

        const formattedTime = Intl.DateTimeFormat(this.$i18n.locale, {
          timeStyle: 'short',
        })
          .format(lastViewDate)
          .replace(':', 'h');

        return this.$t('last_online_time.date', { date: formattedDate, time: formattedTime });
      }

      const dateDifferenceInMinutes = dateDifferenceInHours * 60;
      return dateDifferenceInMinutes > 60
        ? this.$t('last_online_time.hours', { hours: Number.parseInt(dateDifferenceInHours, 10) })
        : this.$t('last_online_time.minutes', {
            minutes: Number.parseInt(dateDifferenceInMinutes, 10),
          });
    },
    getDatesDifferenceInHours(a, b) {
      const differenceInMs = Math.abs(a - b);
      const oneHoursInMs = 60 * 60 * 1000;
      const differenceInHours = differenceInMs / oneHoursInMs;
      return differenceInHours;
    },
    getLastContactText(lastContact) {
      const today = new Date();
      const lastContactDate = new Date(lastContact);
      const dateDifferenceInHours = this.getDatesDifferenceInHours(today, lastContactDate);

      if (dateDifferenceInHours >= 24) {
        const formattedDate = Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(lastContactDate);

        return this.$t('last_message_time.date', { date: formattedDate });
      }

      const dateDifferenceInMinutes = dateDifferenceInHours * 60;
      return dateDifferenceInMinutes > 60
        ? this.$t('last_message_time.hours', { hours: Number.parseInt(dateDifferenceInHours, 10) })
        : this.$t('last_message_time.minutes', {
            minutes: Number.parseInt(dateDifferenceInMinutes, 10),
          });
    },
    lowercase(value) {
      return value.toString().toLowerCase();
    },
    transferContact() {
      this.$store.commit('chats/removeChat', this.room);
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
