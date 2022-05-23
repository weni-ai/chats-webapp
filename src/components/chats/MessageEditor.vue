<template>
  <div class="message-editor">
    <div class="suggestion-box-container" :style="{ bottom: height + 'px' }">
      <suggestion-box :text="message" :suggestions="shortcuts" />
    </div>

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
        <file-uploader v-model="files" @upload="upload">
          <template #trigger="{ open }">
            <unnnic-tool-tip enabled text="Enviar mídia" side="top">
              <unnnic-dropdown position="top-left">
                <template #trigger>
                  <slot name="trigger">
                    <unnnic-button-icon slot="trigger" icon="upload-bottom-1" size="small" />
                  </slot>
                </template>
                <unnnic-dropdown-item>
                  <span
                    class="upload-dropdown-option"
                    @click="open('media')"
                    @keypress.enter="open('media')"
                  >
                    <unnnic-icon-svg icon="video-file-mp4-1" />
                    <span> Enviar foto ou vídeo </span>
                  </span>
                </unnnic-dropdown-item>
                <unnnic-dropdown-item>
                  <span
                    class="upload-dropdown-option"
                    @click="open('document')"
                    @keypress.enter="open('document')"
                  >
                    <unnnic-icon-svg icon="upload-bottom-1" />
                    <span> Enviar documento </span>
                  </span>
                </unnnic-dropdown-item>
              </unnnic-dropdown>
            </unnnic-tool-tip>
          </template>
        </file-uploader>

        <unnnic-tool-tip enabled text="Mensagens rápidas" side="top">
          <unnnic-button-icon icon="flash-1-3" size="small" @click="$emit('show-quick-messages')" />
        </unnnic-tool-tip>
      </div>

      <unnnic-button
        text="Enviar"
        iconLeft="send-email-3-1"
        size="small"
        class="send-button"
        @click="sendMessage"
      />
    </div>
  </div>
</template>

<script>
import FileUploader from '@/components/chats/FileUploader';
import SuggestionBox from './SuggestionBox.vue';

export default {
  name: 'MessageEditor',

  components: {
    FileUploader,
    SuggestionBox,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  mounted() {
    if (this.$el) this.height = this.$el.clientHeight;
  },

  data: () => ({
    files: [],
    height: 0,
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
    shortcuts() {
      const quickMessages = [
        {
          id: 1,
          title: 'Boas-vindas',
          shortcut: 'boas-vindas',
          message: 'Olá, seja bem vindo (a)! Em que posso te ajudar?',
        },
        {
          id: 2,
          title: 'Transferência',
          shortcut: 'transferencia',
          message: 'Agradeço sua paciência, te transferirei para outro departamento.',
        },
      ];

      return quickMessages.map(({ shortcut, message }) => ({
        shortcut,
        value: message,
      }));
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
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: $unnnic-spacing-stack-lg;

  padding: $unnnic-inline-sm;
  border: solid 1px $unnnic-color-neutral-clean;
  border-radius: $unnnic-border-radius-sm;

  .suggestion-box-container {
    position: absolute;
    left: 0;
    margin-bottom: $unnnic-spacing-inline-xs;
  }

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
    gap: $unnnic-spacing-stack-xs;

    .secondary {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-stack-xs;

      .upload-dropdown-option {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: $unnnic-spacing-stack-xs;
      }
    }

    .send-button {
      width: 100%;
    }
  }
}
</style>
