<template>
  <AsideSlotTemplate
    :title="$t('quick_message')"
    icon="bolt"
    :close="() => $emit('close')"
  >
    <AsideSlotTemplateSection class="messages-section__container">
      <QuickMessagesList
        @select-quick-message="selectQuickMessage"
        @edit-quick-message="quickMessageToEdit = $event"
        @delete-quick-message="quickMessageToDelete = $event"
      />

      <UnnnicButton
        v-if="isMobile"
        class="quick-messages__mobile-new"
        float
        type="primary"
        iconCenter="add"
        size="extra-large"
        data-testid="quick-message-new-button-mobile"
        @click="openQuickMessageCreation"
      />

      <UnnnicButton
        v-else
        iconLeft="add"
        :text="$t('quick_messages.new')"
        type="secondary"
        size="small"
        class="fill-w"
        data-testid="quick-message-new-button"
        @click="openQuickMessageCreation"
      />
    </AsideSlotTemplateSection>

    <template #modals>
      <ModalQuickMessages
        v-if="quickMessageToEdit"
        :quickMessage="quickMessageToEdit"
        :title="quickMessageFormTitle"
        :isLoading="isLoadingUpdateQuickMessage"
        @save="
          quickMessageToEdit?.uuid
            ? updateQuickMessage(quickMessageToEdit)
            : createQuickMessage(quickMessageToEdit)
        "
        @close="quickMessageToEdit = null"
        @update:quick-message="quickMessageToEdit = $event"
      />
      <ModalDeleteQuickMessage
        v-if="quickMessageToDelete"
        :quickMessage="quickMessageToDelete"
        :isLoading="isLoadingDeleteQuickMessage"
        @confirm="deleteQuickMessage()"
        @close="quickMessageToDelete = null"
      />
    </template>
  </AsideSlotTemplate>
</template>

<script>
import isMobile from 'is-mobile';
import { mapActions } from 'pinia';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import QuickMessagesList from './QuickMessagesList.vue';
import ModalQuickMessages from './ModalEditQuickMessages.vue';
import ModalDeleteQuickMessage from './ModalDeleteQuickMessage.vue';

import { useQuickMessages } from '@/store/modules/chats/quickMessages';

export default {
  name: 'QuickMessages',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    QuickMessagesList,
    ModalQuickMessages,
    ModalDeleteQuickMessage,
  },
  emits: ['close', 'select-quick-message'],

  data() {
    return {
      isMobile: isMobile(),

      quickMessageToDelete: null,
      quickMessageToEdit: null,
      isLoadingUpdateQuickMessage: false,
      isLoadingDeleteQuickMessage: false,
    };
  },
  computed: {
    isEditing() {
      const { quickMessageToEdit } = this;
      return quickMessageToEdit && quickMessageToEdit.uuid;
    },
    isCreating() {
      const { quickMessageToEdit } = this;
      return quickMessageToEdit && !quickMessageToEdit.uuid;
    },

    quickMessageFormTitle() {
      if (this.isEditing) {
        return this.$t('quick_messages.edit');
      }

      if (this.isCreating) {
        return this.$t('quick_messages.add');
      }

      return '';
    },

    emptyQuickMessage() {
      return { title: '', text: '', shortcut: '' };
    },
  },

  methods: {
    ...mapActions(useQuickMessages, {
      actionCreateQuickMessage: 'create',
      actionUpdateQuickMessage: 'update',
      actionDeleteQuickMessage: 'delete',
    }),

    async createQuickMessage({ title, text, shortcut }) {
      try {
        this.isLoadingUpdateQuickMessage = true;
        this.actionCreateQuickMessage({ title, text, shortcut });

        callUnnnicAlert({
          props: {
            text: this.$t('quick_messages.successfully_added'),
            type: 'success',
            scheme: 'feedback-green',
            onClose: this.$t('close'),
          },
          seconds: 5,
        });

        this.quickMessageToEdit = null;
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoadingUpdateQuickMessage = false;
      }
    },
    async updateQuickMessage({ uuid, title, text, shortcut }) {
      try {
        this.isLoadingUpdateQuickMessage = true;
        this.actionUpdateQuickMessage({ uuid, title, text, shortcut });

        callUnnnicAlert({
          props: {
            text: this.$t('quick_messages.successfully_updated'),
            type: 'success',
          },
          seconds: 5,
        });

        this.quickMessageToEdit = null;
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoadingUpdateQuickMessage = false;
      }
    },
    openQuickMessageCreation() {
      this.quickMessageToEdit = this.emptyQuickMessage;
    },
    async deleteQuickMessage() {
      try {
        this.isLoadingDeleteQuickMessage = true;
        const { uuid } = this.quickMessageToDelete;

        this.actionDeleteQuickMessage(uuid);
        this.quickMessageToDelete = null;
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoadingDeleteQuickMessage = false;
      }
    },
    selectQuickMessage(quickMessage) {
      if (this.isMobile) {
        this.quickMessageToEdit = quickMessage;
      } else {
        this.$emit('select-quick-message', quickMessage);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.messages-section__container {
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;

  overflow: hidden;
}

.quick-messages__modal-delete {
  :deep(.unnnic-modal-container) .unnnic-modal-container-background {
    &-body-description {
      text-align: center;
    }
    &-button :first-child {
      margin-right: $unnnic-spacing-xs;
    }
  }
}

.quick-messages-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  &__title {
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-regular;
    color: $unnnic-color-neutral-dark;
  }

  &__form {
    flex: 1 1;
  }
}
.quick-messages__mobile-new {
  margin: 0 $unnnic-spacing-ant $unnnic-spacing-md 0;
}
</style>
