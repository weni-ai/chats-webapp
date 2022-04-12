<template>
  <aside class="macro-messages">
    <section v-show="!areEditingOrCreating">
      <header>
        <span>Mensagens instantâneas</span>
        <span @click="$emit('close')" aria-label="close icon" @keypress.enter="$emit('close')">
          <unnnic-icon-svg icon="close-1" size="sm" class="header-button" />
        </span>
      </header>

      <div class="messages-list">
        <macro-message-card
          v-for="macroMessage in macroMessages"
          :key="macroMessage.id"
          :title="macroMessage.title"
          :message="macroMessage.message"
          @select="$emit('select-macro-message', macroMessage)"
          @edit="macroMessageToEdit = macroMessage"
          @delete="macroMessageToDelete = macroMessage"
        />
      </div>

      <unnnic-button
        class="new-message-button"
        icon-left="add-circle-1"
        text="Adicionar mensagem instantânea"
        type="secondary"
        size="small"
        @click="macroMessageToEdit = createEmptyMacroMessage()"
      />
    </section>

    <section v-if="areEditingOrCreating" class="create-section">
      <header>
        <span>Adicionar modelo de mensagem</span>
        <span @click="macroMessageToEdit = null" @keypress.enter="macroMessageToEdit = null">
          <unnnic-icon icon="keyboard-return-1" size="sm" class="header-button" />
        </span>
      </header>

      <macro-message-form
        v-model="macroMessageToEdit"
        class="macro-message-form"
        @submit="addMacroMessage(macroMessageToEdit)"
        @cancel="macroMessageToEdit = null"
      />
    </section>

    <unnnic-modal
      text="Deletar macro"
      description="Você tem certeza que deseja deletar a resposta instantânea?"
      scheme="feedback-yellow"
      modal-icon="alert-circle-1"
      @close="macroMessageToDelete = null"
      :show-modal="!!macroMessageToDelete"
    >
      <template #options>
        <unnnic-button text="Confirmar" type="terciary" @click="deleteMacroMessage" />
        <unnnic-button text="Cancelar" @click="macroMessageToDelete = null" />
      </template>
    </unnnic-modal>
  </aside>
</template>

<script>
import MacroMessageCard from './MacroMessageCard';
import MacroMessageForm from './MacroMessageForm';

export default {
  name: 'MacroMessages',

  components: {
    MacroMessageCard,
    MacroMessageForm,
  },

  data: () => ({
    macroMessages: [
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
    macroMessageToDelete: null,
    macroMessageToEdit: null,
  }),

  computed: {
    areEditingOrCreating() {
      return !!this.macroMessageToEdit;
    },
  },

  methods: {
    addMacroMessage(newMacroMessage) {
      if (newMacroMessage.id) {
        this.macroMessages = this.macroMessages.map((macroMessage) => {
          if (macroMessage.id === newMacroMessage.id) return { ...newMacroMessage };

          return macroMessage;
        });

        this.macroMessageToEdit = null;
        return;
      }

      this.macroMessages.push({
        ...newMacroMessage,
        id: Math.random() * 100 + 1,
      });

      this.macroMessageToEdit = null;
    },
    createEmptyMacroMessage() {
      return { title: '', message: '', shortcut: null };
    },
    deleteMacroMessage() {
      this.macroMessages = this.macroMessages.filter(
        (macroMessage) => macroMessage.id !== this.macroMessageToDelete.id,
      );

      this.macroMessageToDelete = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.macro-messages {
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

    .macro-message-form {
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
