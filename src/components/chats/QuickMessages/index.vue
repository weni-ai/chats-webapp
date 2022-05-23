<template>
  <aside v-if="false" class="quick-messages">
    <section v-show="!areEditingOrCreating">
      <header>
        <span>Mensagens rápidas</span>
        <span @click="$emit('close')" aria-label="close icon" @keypress.enter="$emit('close')">
          <unnnic-icon-svg icon="close-1" size="sm" class="header-button" />
        </span>
      </header>

      <div class="messages-list">
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
        class="new-message-button"
        icon-left="add-circle-1"
        text="Adicionar nova mensagem rápida"
        type="secondary"
        size="small"
        @click="quickMessageToEdit = createEmptyQuickMessage()"
      />
    </section>

    <section v-if="areEditingOrCreating" class="create-section">
      <header>
        <span>
          {{
            quickMessageToEdit.id ? 'Editar modelo de mensagem' : 'Adicionar nova mensagem rápida'
          }}
        </span>
        <span @click="quickMessageToEdit = null" @keypress.enter="quickMessageToEdit = null">
          <unnnic-icon icon="keyboard-return-1" size="sm" class="header-button" />
        </span>
      </header>

      <quick-message-form
        v-model="quickMessageToEdit"
        class="quick-message-form"
        @submit="addQuickMessage(quickMessageToEdit)"
        @cancel="quickMessageToEdit = null"
      />
    </section>
  </aside>

  <aside-slot-template
    v-else-if="!isEditing && !isCreating"
    title="Mensagens rápidas"
    icon="flash-1-3"
    @action="$emit('close')"
  >
    <aside-slot-template-section class="fill-h">
      <section class="fill-h message-list">
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
      </section>
    </aside-slot-template-section>

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
    iconAction="keyboard-arrow-left-1"
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
    quickMessages: [
      {
        id: 1,
        title: 'Boas-vindas',
        message: 'Olá, seja bem vindo (a)! Em que posso te ajudar?',
      },
      {
        id: 2,
        title: 'Transferência',
        message: 'Agradeço sua paciência, te transferirei para outro departamento.',
      },
    ],
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
    addQuickMessage(newQuickMessage) {
      if (newQuickMessage.id) {
        this.quickMessages = this.quickMessages.map((quickMessage) => {
          if (quickMessage.id === newQuickMessage.id) return { ...newQuickMessage };

          return quickMessage;
        });

        this.quickMessageToEdit = null;
        return;
      }

      this.quickMessages.push({
        ...newQuickMessage,
        id: Math.random() * 100 + 1,
      });

      this.quickMessageToEdit = null;
    },
    createEmptyQuickMessage() {
      return { title: '', message: '', shortcut: null };
    },
    deleteQuickMessage() {
      this.quickMessages = this.quickMessages.filter(
        (quickMessage) => quickMessage.id !== this.quickMessageToDelete.id,
      );

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

.message-list {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: $unnnic-spacing-stack-sm;

  .messages {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
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
