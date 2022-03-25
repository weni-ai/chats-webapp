<template>
  <div class="message-editor" :class="{ 'col-2': showingSidebar }">
    <textarea
      v-model="message"
      class="editor"
      aria-label="message-editor"
      placeholder="Digite sua mensagem"
    />

    <div class="actions" :class="{ stacked: showingSidebar }">
      <unnnic-button
        type="secondary"
        text="Mensagens prontas"
        size="small"
        @click="$emit('showMacroMessages')"
      />
      <unnnic-button text="Enviar" iconLeft="send-mail-3-1" size="small" class="send-button" />
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

  props: {
    showingSidebar: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: '',
    },
  },

  computed: {
    message: {
      get() {
        return this.value;
      },
      set(message) {
        this.$emit('input', message);
      },
    },
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

  &.col-2 {
    flex-direction: row;
  }

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

    &.stacked {
      flex-direction: column;

      .send-button {
        width: 100%;
      }
    }
  }
}
</style>
