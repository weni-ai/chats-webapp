<template>
  <AsideSlotTemplate
    class="quick-messages-container"
    :title="$t('quick_message')"
    icon="bolt"
    :close="() => $emit('close')"
  >
    <HeaderQuickMessages @close="$emit('close')" />

    <UnnnicDisclaimer
      class="quick-messages-disclaimer"
      type="informational"
      :text="$t('quick_messages.disclaimer')"
    />

    <AsideSlotTemplateSection class="messages-section__container">
      <QuickMessagesList
        showNewButton
        withHandlers
        showExpand
        :title="$t('quick_messages.personal')"
        :quickMessages="quickMessages"
        :withoutMessagesText="$t('quick_messages.without_personal_messages')"
        @select-quick-message="selectQuickMessage"
        @edit-quick-message="quickMessageToEdit = $event"
        @delete-quick-message="quickMessageToDelete = $event"
        @open-new-quick-message="openQuickMessageCreation"
      />
      <QuickMessagesList
        :title="$t('quick_messages.shared')"
        :quickMessages="quickMessagesShared"
        :withoutMessagesText="$t('quick_messages.without_messages_shared')"
        @select-quick-message="selectQuickMessage"
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
import { mapActions, mapState } from 'pinia';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import HeaderQuickMessages from './HeaderQuickMessages.vue';
import QuickMessagesList from './QuickMessagesList.vue';
import ModalQuickMessages from './ModalEditQuickMessages.vue';
import ModalDeleteQuickMessage from './ModalDeleteQuickMessage.vue';

import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

export default {
  name: 'QuickMessages',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    QuickMessagesList,
    ModalQuickMessages,
    ModalDeleteQuickMessage,
    HeaderQuickMessages,
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
    ...mapState(useQuickMessages, ['quickMessages']),
    ...mapState(useQuickMessageShared, ['quickMessagesShared']),

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
:deep(.aside-slot-template__sections) {
  flex: unset;
}
.quick-messages-disclaimer {
  margin: $unnnic-space-2;
}

.messages-section__container {
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;

  overflow: auto;
}
</style>
