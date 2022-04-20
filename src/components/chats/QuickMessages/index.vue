<template>
  <aside class="quick-messages">
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

    <unnnic-modal
      text="Deletar mensagem rápida"
      description="Você tem certeza que deseja deletar a mensagem rápida?"
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
  </aside>
</template>

<script>
import QuickMessageCard from './QuickMessageCard';
import QuickMessageForm from './QuickMessageForm';

export default {
  name: 'QuickMessages',

  components: {
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
    areEditingOrCreating() {
      return !!this.quickMessageToEdit;
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
.quick-messages {
  height: 100%;
  padding-right: 1rem;

  section {
    display: flex;
    flex-direction: column;
    height: 100%;

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      span {
        color: $unnnic-color-neutral-dark;
        line-height: 1.5rem;
      }

      .header-button {
        cursor: pointer;
      }
    }

    .quick-message-form {
      flex: 1 1;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 1rem;
    }

    .new-message-button {
      width: 100%;
      margin-top: auto;
      flex: none;
    }
  }
}
</style>
