<template>
  <aside-slot-template
    v-if="!isEditing && !isCreating"
    title="Mensagens rápidas"
    icon="flash-1-3"
    @action="$emit('close')"
  >
    <section class="messages-container">
      <aside-slot-template-section class="messages-section">
        <div class="messages">
          <quick-message-card
            v-for="quickMessage in quickMessages"
            :key="quickMessage.id"
            :quickMessage="quickMessage"
            clickable
            @select="$emit('select-quick-message', quickMessage)"
            @edit="quickMessageToEdit = quickMessage"
            @delete="quickMessageToDelete = quickMessage"
          />
        </div>

        <unnnic-button
          icon-left="add-circle-1"
          text="Adicionar nova mensagem rápida"
          type="secondary"
          size="small"
          class="fill-w"
          @click="quickMessageToEdit = createEmptyQuickMessage()"
        />
      </aside-slot-template-section>
    </section>

    <unnnic-modal
      text="Excluir mensagem rápida"
      description="Você tem certeza que deseja excluir a mensagem rápida?"
      scheme="feedback-yellow"
      modal-icon="alert-circle-1"
      @close="quickMessageToDelete = null"
      :show-modal="!!quickMessageToDelete"
    >
      <template #options>
        <unnnic-button text="Confirmar" type="terciary" @click="deleteQuickMessage" />
        <unnnic-button text="Cancelar" @click="quickMessageToDelete = null" />
      </template>
    </unnnic-modal>
  </aside-slot-template>

  <aside-slot-template
    v-else
    :title="isEditing ? 'Editar mensagem rápida' : 'Adicionar mensagem rápida'"
    icon="flash-1-3"
    no-icon-action
    @action="quickMessageToEdit = null"
  >
    <aside-slot-template-section class="fill-h">
      <section class="fill-h quick-message-form">
        <quick-message-form
          v-model="quickMessageToEdit"
          class="quick-message-form__form"
          @submit="addQuickMessage(quickMessageToEdit)"
          @cancel="quickMessageToEdit = null"
        />
      </section>
    </aside-slot-template-section>
  </aside-slot-template>
</template>

<script>
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
    isEditing() {
      return !!this.quickMessageToEdit && this.quickMessageToEdit.id;
    },
    isCreating() {
      return !!this.quickMessageToEdit && !this.quickMessageToEdit.id;
    },
    quickMessages() {
      return this.$store.state.chats.quickMessages.messages;
    },
  },

  methods: {
    addQuickMessage(quickMessage) {
      if (!quickMessage.id) this.$store.commit('chats/quickMessages/addMessage', quickMessage);
      else this.$store.commit('chats/quickMessages/updateMessage', quickMessage);

      this.quickMessageToEdit = null;
    },
    createEmptyQuickMessage() {
      return { title: '', message: '', shortcut: null };
    },
    deleteQuickMessage() {
      this.$store.commit('chats/quickMessages/deleteMessage', this.quickMessageToDelete);
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
