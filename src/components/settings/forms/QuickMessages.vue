<template>
  <section class="form-quick-messages">
    <quick-message-form
      v-if="quickMessageToUpdate"
      v-model="quickMessageToUpdate"
      class="quick-message-form__form"
      externalActions
    />
    <list-sector-quick-messages
      v-else
      :sector="sector.name"
      :quick-messages-shared="quickMessagesShared"
    />
  </section>
</template>

<script>
import { mapActions } from 'vuex';

import { unnnicCallAlert } from '@weni/unnnic-system';

import ListSectorQuickMessages from '@/components/settings/lists/ListSectorQuickMessages';
import QuickMessageForm from '@/components/chats/QuickMessages/QuickMessageForm';

export default {
  name: 'FormQuickMessages',

  components: {
    QuickMessageForm,
    ListSectorQuickMessages,
  },

  props: {
    quickMessagesShared: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    quickMessageToUpdate: null,
  }),

  computed: {
    tags: {
      get() {
        return this.value;
      },
      set(tags) {
        this.$emit('input', tags);
      },
    },
  },

  methods: {
    ...mapActions({
      actionCreateQuickMessage: 'chats/quickMessagesShared/create',
      actionUpdateQuickMessage: 'chats/quickMessagesShared/update',
      actionDeleteQuickMessage: 'chats/quickMessagesShared/delete',
    }),

    create() {
      this.quickMessageToUpdate = { title: '', text: '', shortcut: null };
    },

    async save({ sectorUuid }) {
      await this.actionCreateQuickMessage({ sectorUuid, ...this.quickMessageToUpdate });

      unnnicCallAlert({
        props: {
          title: this.$t('quick_messages.successfully_added'),
          icon: 'check-circle-1-1-1',
          scheme: 'feedback-green',
          closeText: this.$t('close'),
          position: 'bottom-right',
        },
        seconds: 5,
      });

      this.quickMessageToUpdate = null;
    },

    async update({ uuid, title, text, shortcut }) {
      this.actionUpdateQuickMessage({ uuid, title, text, shortcut });

      unnnicCallAlert({
        props: {
          title: this.$t('quick_messages.successfully_added'),
          icon: 'check-circle-1-1-1',
          scheme: 'feedback-green',
          closeText: this.$t('close'),
          position: 'bottom-right',
        },
        seconds: 5,
      });

      this.quickMessageToEdit = null;
    },

    async delete() {
      const { uuid } = this.quickMessageToDelete;

      this.actionDeleteQuickMessage(uuid);
      this.quickMessageToDelete = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.form-quick-messages {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-md;

  &__description {
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-cloudy;
  }

  &__section {
    &__label {
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      margin-bottom: $unnnic-spacing-inline-sm;
    }

    &__input-group {
      display: flex;
      align-items: flex-end;
      gap: $unnnic-spacing-stack-sm;

      &__input {
        flex: 1 1;
      }
    }
  }
}
</style>
