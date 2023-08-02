<template>
  <aside-slot-template
    v-if="!isEditing && !isCreating"
    :title="$t('quick_message')"
    icon="flash-1-3"
    @action="$emit('close')"
  >
    <aside-slot-template-section class="messages-section__container">
      <div class="messages-section">
        <app-accordion class="messages" :title="$t('quick_messages.personal')">
          <template v-slot:content>
            <div class="chat-group">
              <quick-message-card
                v-for="quickMessage in quickMessages"
                :key="quickMessage.uuid"
                :quickMessage="quickMessage"
                clickable
                @select="$emit('select-quick-message', quickMessage)"
                @edit="quickMessageToEdit = quickMessage"
                @delete="quickMessageToDelete = quickMessage"
              />
            </div>
          </template>
        </app-accordion>
        <app-accordion class="messages-shared" :title="$t('quick_messages.shared')">
          <template v-slot:content>
            <div class="chat-group">
              <quick-message-card
                v-for="quickMessage in quickMessagesShared"
                :key="quickMessage.uuid"
                :quickMessage="quickMessage"
                clickable
                @select="$emit('select-quick-message', quickMessage)"
                @edit="quickMessageToEdit = quickMessage"
                @delete="quickMessageToDelete = quickMessage"
              />
            </div>
          </template>
        </app-accordion>
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
import AppAccordion from '@/components/chats/AppAccordion';
import QuickMessage from '@/services/api/resources/chats/quickMessage';
import { mapState } from 'vuex';
import QuickMessageCard from './QuickMessageCard';
import QuickMessageForm from './QuickMessageForm';

export default {
  name: 'QuickMessages',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    AppAccordion,
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

.messages-section {
  height: 100%;
  overflow: hidden scroll;

  &__container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;
    height: 100%;
  }
}

.messages {
  flex: 1 1;
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;
  border-right: solid 1px #e2e6ed;

  // insert space between content and scrollbar
  margin-right: -$unnnic-spacing-inline-md;
  padding-right: $unnnic-spacing-inset-md;
}

.quick-message-form {
  display: flex;
  flex-direction: column;

  &__form {
    flex: 1 1;
  }
}
</style>
