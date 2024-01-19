<template>
  <aside-slot-template
    v-if="!isEditing && !isCreating"
    :title="$t('quick_message')"
    icon="bolt"
    :close="() => $emit('close')"
  >
    <aside-slot-template-section class="messages-section__container">
      <div class="messages-section">
        <unnnic-collapse class="messages" active :title="$t('quick_messages.personal')">
          <quick-message-card
            v-for="quickMessage in quickMessages"
            :key="quickMessage.uuid"
            :quickMessage="quickMessage"
            clickable
            @select="selectQuickMessage"
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
            @select="selectQuickMessage"
            @edit="quickMessageToEdit = quickMessage"
            @delete="quickMessageToDelete = quickMessage"
          />
        </unnnic-collapse>
      </div>

      <unnnic-button
        icon-left="add"
        :text="$t('quick_messages.new')"
        type="secondary"
        size="small"
        class="fill-w"
        @click="quickMessageToEdit = createEmptyQuickMessage()"
      />
    </aside-slot-template-section>

    <template v-slot:modals>
      <unnnic-modal
        :text="$t('quick_messages.delete')"
        :description="$t('quick_messages.delete_confirm')"
        scheme="feedback-yellow"
        modal-icon="alert-circle-1"
        @close="quickMessageToDelete = null"
        :show-modal="!!quickMessageToDelete"
      >
        <template #options>
          <unnnic-button
            :text="$t('cancel')"
            type="secondary"
            @click="quickMessageToDelete = null"
          />
          <unnnic-button :text="$t('confirm')" type="tertiary" @click="deleteQuickMessage" />
        </template>
      </unnnic-modal>
    </template>
  </aside-slot-template>

  <aside-slot-template
    v-else
    :title="$t('quick_message')"
    icon="bolt"
    :back="() => (quickMessageToEdit = null)"
    :close="() => $emit('close')"
  >
    <aside-slot-template-section class="fill-h fill-w">
      <section class="fill-h quick-messages-form">
        <h1 class="quick-messages-form__title">{{ quickMessageFormTitle }}</h1>
        <quick-message-form
          v-model="quickMessageToEdit"
          class="quick-messages-form__form"
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
import isMobile from 'is-mobile';
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
    isMobile: isMobile(),

    quickMessageToDelete: null,
    quickMessageToEdit: null,
  }),

  computed: {
    ...mapState({
      quickMessages: (state) => state.chats.quickMessages.quickMessages,
      quickMessagesShared: (state) => state.chats.quickMessagesShared.quickMessagesShared,
    }),

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
</style>
