<template>
  <aside-slot-template
    v-if="!isEditing && !isCreating"
    :title="$t('quick_message')"
    icon="flash-1-3"
    @action="$emit('close')"
  >
    <section class="messages-container">
      <aside-slot-template-section class="messages-section">
        <div class="messages">
          <quick-message-card
            v-for="quickMessage in $store.state.chats.quickMessages.messages"
            :key="quickMessage.uuid"
            :quickMessage="quickMessage"
            clickable
            @select="$emit('select-quick-message', quickMessage)"
            @edit="quickMessageToEdit = quickMessage"
            @delete="quickMessageToDelete = quickMessage"
          />
        </div>

        <unnnic-button
          icon-left="add-circle-1"
          :text="$t('quick_messages.add_new')"
          type="secondary"
          size="small"
          class="fill-w"
          @click="quickMessageToEdit = createEmptyQuickMessage()"
        />
      </aside-slot-template-section>
    </section>

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
    :title="isEditing ? $t('quick_messages.edit') : $t('quick_messages.add')"
    icon="flash-1-3"
    no-icon-action
    @action="quickMessageToEdit = null"
  >
    <aside-slot-template-section class="fill-h">
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
import { unnnicCallAlert } from '@weni/unnnic-system';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import QuickMessage from '@/services/api/resources/chats/quickMessage';
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
    isEditing() {
      return !!this.quickMessageToEdit && this.quickMessageToEdit.id;
    },
    isCreating() {
      return !!this.quickMessageToEdit && !this.quickMessageToEdit.id;
    },
  },

  methods: {
    async createQuickMessage({ title, text, shortcut }) {
      const quickMessage = await QuickMessage.create({ title, text, shortcut });
      this.$store.state.chats.quickMessages.messages.push(quickMessage);

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
    async updateQuickMessage({ uuid, title, text, shortcut }) {
      const quickMessage = await QuickMessage.update(uuid, { title, text, shortcut });
      this.$store.state.chats.quickMessages.messages =
        this.$store.state.chats.quickMessages.messages.map((m) =>
          m.uuid === quickMessage.uuid ? quickMessage : m,
        );

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
    createEmptyQuickMessage() {
      return { title: '', text: '', shortcut: null };
    },
    async deleteQuickMessage() {
      const { uuid } = this.quickMessageToDelete;
      await QuickMessage.delete(uuid);
      this.$store.state.chats.quickMessages.messages =
        this.$store.state.chats.quickMessages.messages.filter((m) => m.uuid !== uuid);
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
  width: 103%;
}

.messages-container {
  height: 100%;

  .messages-section {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;
    height: 100%;
  }

  .messages {
    flex: 1 1;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;
    border-right: solid 1px #e2e6ed;

    max-height: 100%;
    overflow-y: auto;
    // insert space between content and scrollbar
    margin-right: -$unnnic-spacing-inline-md;
    padding-right: $unnnic-spacing-inset-md;
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
