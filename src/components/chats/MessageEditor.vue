<template>
  <div class="message-editor">
    <input
      v-model="message"
      class="editor"
      aria-label="message-editor"
      placeholder="Digite sua mensagem"
      type="text"
      @keypress.enter="sendMessage"
    />

    <div class="actions">
      <div class="secondary">
        <file-uploader v-model="files" @upload="upload" />
        <unnnic-button-icon icon="flash-1-3" size="small" @click="$emit('show-quick-messages')" />
      </div>

      <unnnic-button
        text="Enviar"
        iconLeft="send-mail-3-1"
        size="small"
        class="send-button"
        @click="sendMessage"
      />
    </div>
  </div>
</template>

<script>
import FileUploader from '@/components/FileUploader';

export default {
  name: 'MessageEditor',

  components: {
    FileUploader,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    files: [],
  }),

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

  methods: {
    sendMessage() {
      this.$emit('send');

      this.message = '';
    },
    upload() {
      this.$emit('upload', [...this.files]);
    },
  },
};
</script>

<style lang="scss" scoped>
.message-editor {
  display: flex;
  align-items: flex-start;
  gap: 2rem;

  padding: 1rem;
  border: solid 1px $unnnic-color-neutral-clean;
  border-radius: $unnnic-border-radius-sm;

  .editor {
    flex: 1 1;
    resize: none;
    border: none;
    outline: none;
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;

    .secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .send-button {
      width: 100%;
    }
  }
}
</style>
