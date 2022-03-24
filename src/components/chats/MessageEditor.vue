<template>
  <div class="message-editor">
    <textarea class="editor" aria-label="message-editor" placeholder="Digite sua mensagem" />

    <div class="actions">
      <unnnic-button type="secondary" text="Mensagens prontas" size="small" />
      <unnnic-button text="Enviar" iconLeft="send-mail-3-1" size="small" />
    </div>
  </div>
</template>

<script>
import { unnnicButton } from '@weni/unnnic-system';

export default {
  name: 'MessageEditor',

  components: {
    unnnicButton,
  },
};
</script>

<style lang="scss" scoped>
.message-editor {
  display: flex;
  flex-direction: column;
  gap: 2rem;

  padding: 1rem;
  border: solid 1px $unnnic-color-neutral-clean;
  border-radius: $unnnic-border-radius-sm;

  .editor {
    flex: 1;
    resize: none;
    border: none;
    outline: none;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}
</style>
