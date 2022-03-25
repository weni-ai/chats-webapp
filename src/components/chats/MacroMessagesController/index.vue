<template>
  <aside class="macro-messages-controller">
    <header>
      <span>Mensagens instantâneas</span>
      <span @click="$emit('close')" aria-label="close icon" @keypress.enter="$emit('close')">
        <unnnic-icon-svg icon="close-1" size="sm" class="close-icon" />
      </span>
    </header>

    <div class="messages-list">
      <macro-message-card
        v-for="macroMessage in macroMessages"
        :key="macroMessage.id"
        :title="macroMessage.title"
        :message="macroMessage.message"
        @select="$emit('select-macro-message', macroMessage)"
      />
    </div>

    <unnnic-button
      class="new-message-button"
      icon-left="add-circle-1"
      text="Adicionar mensagem instantânea"
      type="secondary"
      size="small"
    />
  </aside>
</template>

<script>
import { unnnicIconSvg, unnnicButton } from '@weni/unnnic-system';
import MacroMessageCard from './MacroMessageCard';

export default {
  name: 'MacroMessagesController',

  components: {
    MacroMessageCard,
    unnnicButton,
    unnnicIconSvg,
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
  }),
};
</script>

<style lang="scss" scoped>
.macro-messages-controller {
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

    .close-icon {
      cursor: pointer;
    }
  }

  .messages-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
