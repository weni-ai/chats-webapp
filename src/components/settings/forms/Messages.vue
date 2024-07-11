<template>
  <section class="form-quick-messages">
    <section v-if="quickMessageToUpdate">
      <UnnnicBreadcrumb
        class="form-quick-messages__breadcrumb"
        :crumbs="quickMessagesBreadcrumb"
        @crumb-click="
          () => {
            handleIsQuickMessageEditing(false);
            resetQuickMessageToUpdate();
          }
        "
      />
      <QuickMessageForm
        v-model="quickMessageToUpdate"
        class="quick-message-form__form"
        externalActions
        size="md"
      />
    </section>
    <ListSectorMessages
      v-else
      :sector="sector"
      :quickMessagesShared="quickMessagesShared"
      @create-quick-message="create"
      @edit-quick-message="update"
      @delete-quick-message="this.delete"
    />
  </section>
</template>

<script>
import { mapActions } from 'pinia';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

import unnnic from '@weni/unnnic-system';

import ListSectorMessages from '@/components/settings/lists/ListSectorMessages.vue';
import QuickMessageForm from '@/components/chats/QuickMessages/QuickMessageForm.vue';

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
  emits: ['update-is-quick-message-editing', 'validate'],

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

  watch: {
    quickMessageToUpdate() {
      this.$emit('validate', this.validate());
    },
  },

  methods: {
    ...mapActions(useQuickMessageShared, {
      actionCreateQuickMessage: 'create',
      actionUpdateQuickMessage: 'update',
      actionDeleteQuickMessage: 'delete',
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
        await this.actionCreateQuickMessage({
          sectorUuid: uuid,
          ...this.quickMessageToUpdate,
        });
      }

      unnnic.unnnicCallAlert({
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

    :deep() .unnnic-breadcrumb__container {
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
