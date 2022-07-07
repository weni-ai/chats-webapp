<template>
  <section>
    <div class="suggestion-box-container">
      <div class="suggestion-box">
        <suggestion-box
          :search="message"
          :suggestions="shortcuts"
          :keyboard-event="keyboardEvent"
          @open="isSuggestionBoxOpen = true"
          @close="isSuggestionBoxOpen = false"
          @select="(message = $event.preview), focusMessageEditor()"
        />
      </div>
    </div>

    <div class="message-editor">
      <input
        v-model="message"
        class="editor"
        ref="messageEditor"
        @keydown="onKeyDown"
        aria-label="message-editor"
        placeholder="Digite uma mensagem ou use um /atalho"
        type="text"
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
            <unnnic-button-icon
              icon="flash-1-3"
              size="small"
              @click="$emit('show-quick-messages')"
            />
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
  </section>
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

  data: () => ({
    files: [],
    keyboardEvent: null,
    isSuggestionBoxOpen: false,
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
      const quickMessages = this.$store.state.chats.quickMessages.messages;

      return quickMessages
        .filter((message) => !!message.shortcut)
        .map(({ shortcut, message }) => ({
          shortcut,
          preview: message,
        }));
    },
  },

  methods: {
    /**
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
      if (this.isSuggestionBoxOpen) {
        this.keyboardEvent = event;
        return;
      }

      if (event.key === 'Enter') this.sendMessage();
    },
    sendMessage() {
      this.$emit('send');

      this.message = '';
    },
    upload() {
      this.$emit('upload', [...this.files]);
    },
    focusMessageEditor() {
      this.$refs.messageEditor?.focus?.();
    },
  },
};
</script>

<style lang="scss" scoped>
.message-editor {
  display: flex;
  align-items: flex-start;
  gap: $unnnic-spacing-stack-lg;

  padding: $unnnic-inline-sm;
  border: solid 1px $unnnic-color-neutral-clean;
  border-radius: $unnnic-border-radius-sm;

  .suggestion-box-container {
    position: relative;

    .suggestion-box {
      margin-bottom: $unnnic-spacing-inline-xs;
      position: absolute;
      bottom: 0;
      left: 0;
    }
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
