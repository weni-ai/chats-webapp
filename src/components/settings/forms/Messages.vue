<template>
  <section class="form-quick-messages">
    <section v-if="quickMessageToUpdate">
      <unnnic-breadcrumb
        class="form-quick-messages__breadcrumb"
        :crumbs="quickMessagesBreadcrumb"
        @crumbClick="
          () => {
            this.handleIsQuickMessageEditing(false);
            this.resetQuickMessageToUpdate();
          }
        "
      />
      <quick-message-form
        v-model="quickMessageToUpdate"
        class="quick-message-form__form"
        externalActions
        size="md"
      />
    </section>
    <list-sector-messages
      v-else
      :sector="sector"
      :quick-messages-shared="quickMessagesShared"
      @create-quick-message="this.create"
      @edit-quick-message="this.update"
      @delete-quick-message="this.delete"
    />
  </section>
</template>

<script>
import { mapActions } from 'vuex';

import { unnnicCallAlert } from '@weni/unnnic-system';

import ListSectorMessages from '@/components/settings/lists/ListSectorMessages';
import QuickMessageForm from '@/components/chats/QuickMessages/QuickMessageForm';

export default {
  name: 'FormMessages',

  components: {
    QuickMessageForm,
    ListSectorMessages,
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
    quickMessagesBreadcrumb: [
      {
        name: 'Mensagens',
      },
      {
        name: 'Adicionar nova mensagem',
      },
    ],
  }),

  methods: {
    ...mapActions({
      actionCreateQuickMessage: 'chats/quickMessagesShared/create',
      actionUpdateQuickMessage: 'chats/quickMessagesShared/update',
      actionDeleteQuickMessage: 'chats/quickMessagesShared/delete',
    }),

    resetQuickMessageToUpdate() {
      this.quickMessageToUpdate = null;
    },

    handleIsQuickMessageEditing(boolean) {
      this.$emit('update-is-quick-message-editing', boolean);
    },

    create() {
      this.handleIsQuickMessageEditing(true);
      this.quickMessageToUpdate = { title: '', text: '', shortcut: null };
    },

    async save({ uuid }) {
      if (this.quickMessageToUpdate.uuid) {
        await this.actionUpdateQuickMessage({
          quickMessageUuid: this.quickMessageToUpdate.uuid,
          ...this.quickMessageToUpdate,
        });
      } else {
        await this.actionCreateQuickMessage({ sectorUuid: uuid, ...this.quickMessageToUpdate });
      }

      unnnicCallAlert({
        props: {
          text: this.$t('quick_messages.successfully_added'),
          type: 'success',
        },
        seconds: 5,
      });

      this.resetQuickMessageToUpdate();
    },

    async update(quickMessage) {
      this.handleIsQuickMessageEditing(true);
      this.quickMessageToUpdate = quickMessage;
    },

    async delete(uuid) {
      this.actionDeleteQuickMessage(uuid);
    },
    validate() {
      if (!this.quickMessageToUpdate) return false;

      const { title, shortcut, text } = this.quickMessageToUpdate;
      return !!title && shortcut && text;
    },
  },

  computed: {},

  watch: {
    quickMessageToUpdate() {
      this.$emit('validate', this.validate());
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

  &__breadcrumb {
    margin: 0 0 $unnnic-spacing-stack-md;

    ::v-deep .unnnic-breadcrumb__container {
      align-items: center;

      &__link {
        font-size: $unnnic-font-size-body-gt;
      }

      &__divider {
        display: flex;

        svg {
          top: 0;
        }
      }
    }
  }
}
</style>
