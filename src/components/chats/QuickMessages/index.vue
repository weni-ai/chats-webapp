<template>
  <aside-slot-template
    v-if="!isEditing && !isCreating"
    :title="$t('quick_message')"
    icon="flash-1-3"
    @close="$emit('close')"
  >
    <aside-slot-template-section class="messages-section__container">
      <div class="messages-section">
        <unnnic-collapse class="messages" active :title="$t('quick_messages.personal')">
          <quick-message-card
            v-for="quickMessage in quickMessages"
            :key="quickMessage.uuid"
            :quickMessage="quickMessage"
            clickable
            @select="$emit('select-quick-message', quickMessage)"
            @edit="quickMessageToEdit = quickMessage"
            @delete="quickMessageToDelete = quickMessage"
          />
        </unnnic-collapse>
        <unnnic-collapse
          v-if="quickMessagesShared.length > 0"
          class="messages-shared"
          :title="$t('quick_messages.shared')"
          active
        >
          <quick-message-card
            v-for="quickMessage in quickMessagesShared"
            :key="quickMessage.uuid"
            :quickMessage="quickMessage"
            :withActions="false"
            clickable
            @select="$emit('select-quick-message', quickMessage)"
            @edit="quickMessageToEdit = quickMessage"
            @delete="quickMessageToDelete = quickMessage"
          />
        </unnnic-collapse>
      </div>

      <unnnic-button-next
        icon-left="add-1"
        :text="$t('quick_messages.new')"
        type="terciary"
        size="small"
        class="fill-w"
        @click="quickMessageToEdit = createEmptyQuickMessage()"
      />
    </aside-slot-template-section>

    <unnnic-modal
      :text="$t('quick_messages.delete')"
      :description="$t('quick_messages.delete_confirm')"
      scheme="feedback-yellow"
      modal-icon="alert-circle-1"
      @close="quickMessageToDelete = null"
      :show-modal="!!quickMessageToDelete"
    >
      <template #options>
        <unnnic-button :text="$t('cancel')" type="terciary" @click="quickMessageToDelete = null" />
        <unnnic-button :text="$t('confirm')" type="secondary" @click="deleteQuickMessage" />
      </template>
    </unnnic-modal>
  </aside-slot-template>

  <aside-slot-template
    v-else
    :title="$t('quick_message')"
    icon="flash-1-3"
    :back="() => (quickMessageToEdit = null)"
    @close="$emit('close')"
  >
    <aside-slot-template-section class="fill-h fill-w">
      <section class="fill-h quick-message-form">
        <quick-message-form
          v-model="quickMessageToEdit"
          class="quick-message-form__form"
          @submit="
            !!quickMessageToEdit.uuid
              ? updateQuickMessage(quickMessageToEdit)
              : createQuickMessage(quickMessageToEdit)
          "
          @cancel="quickMessageToEdit = null"
        />
      </section>
    </aside-slot-template-section>
  </aside-slot-template>
</template>

<script>
import { mapState, mapActions } from 'vuex';

import { unnnicCallAlert } from '@weni/unnnic-system';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';

import QuickMessageCard from './QuickMessageCard';
import QuickMessageForm from './QuickMessageForm';

export default {
  name: 'QuickMessages',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    QuickMessageCard,
    QuickMessageForm,
  },

  data: () => ({
    quickMessageToDelete: null,
    quickMessageToEdit: null,
  }),

  computed: {
    ...mapState({
      quickMessages: (state) => state.chats.quickMessages.quickMessages,
      quickMessagesShared: (state) => state.chats.quickMessagesShared.quickMessagesShared,
    }),

    isEditing() {
      return !!this.quickMessageToEdit && this.quickMessageToEdit.id;
    },
    isCreating() {
      return !!this.quickMessageToEdit && !this.quickMessageToEdit.id;
    },
  },

  methods: {
    ...mapActions({
      actionCreateQuickMessage: 'chats/quickMessages/create',
      actionUpdateQuickMessage: 'chats/quickMessages/update',
      actionDeleteQuickMessage: 'chats/quickMessages/delete',
    }),

    async createQuickMessage({ title, text, shortcut }) {
      this.actionCreateQuickMessage({ title, text, shortcut });

      unnnicCallAlert({
        props: {
          text: this.$t('quick_messages.successfully_added'),
          type: 'success',
          scheme: 'feedback-green',
          onClose: this.$t('close'),
        },
        seconds: 5,
      });

      this.quickMessageToEdit = null;
    },
    async updateQuickMessage({ uuid, title, text, shortcut }) {
      this.actionUpdateQuickMessage({ uuid, title, text, shortcut });

      unnnicCallAlert({
        props: {
          text: this.$t('quick_messages.successfully_updated'),
          type: 'success',
        },
        seconds: 5,
      });

      this.quickMessageToEdit = null;
    },
    createEmptyQuickMessage() {
      return { title: '', text: '', shortcut: null };
    },
    async deleteQuickMessage() {
      const { uuid } = this.quickMessageToDelete;

      this.actionDeleteQuickMessage(uuid);
      this.quickMessageToDelete = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.fill-h {
  height: 100%;
}

.fill-w {
  width: 100%;
}

.messages-section {
  height: 100%;
  overflow: hidden auto;

  // insert space between content and scrollbar
  margin-right: -$unnnic-spacing-xs;
  padding-right: $unnnic-spacing-xs;

  &__container {
    height: 100%;
    width: 100%;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;

    overflow: hidden;
  }
}

.messages {
  flex: 1 1;
  display: flex;
  flex-direction: column;

  &-group {
    display: grid;
    gap: $unnnic-spacing-stack-sm;
  }
}

.quick-message-form {
  display: flex;
  flex-direction: column;

  &__form {
    flex: 1 1;
  }
}
</style>
