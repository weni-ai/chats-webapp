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
          @select="(message = $event.text), focusTextEditor()"
        />
      </div>
    </div>

    <div class="message-editor">
      <text-box
        v-model="message"
        @send="send"
        @keydown="onKeyDown"
        @paste="handlePaste"
        @action-quick-messages="$emit('show-quick-messages')"
        @action-attachment="openFileUploader"
      />
    </div>
  </section>
</template>

<script>
import TextBox from './TextBox';
import SuggestionBox from './SuggestionBox.vue';

export default {
  name: 'MessageEditor',

  components: {
    TextBox,
    SuggestionBox,
  },

  props: {
    audio: {
      type: HTMLAudioElement,
      default: null,
    },
    value: {
      type: String,
      default: '',
    },
    loadingValue: {
      type: Number,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    keyboardEvent: null,
    isSuggestionBoxOpen: false,
    recording: false,
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
    recordedAudio: {
      get() {
        return this.audio;
      },
      set(audio) {
        this.$emit('update:audio', audio);
      },
    },
    isAudioRecorderVisible() {
      return !!this.audio || this.recording;
    },
    shortcuts() {
      return this.$store.state.chats.quickMessages.messages;
    },
    textEditorTooltips() {
      return {
        Undo: this.$t('undo'),
        Redo: this.$t('redo'),
        RecordAudio: this.$t('record_audio'),
        Bold: this.$t('bold'),
        Italic: this.$t('italic'),
        Underline: this.$t('underline'),
        List: this.$t('list'),
        Left: this.$t('left'),
        Center: this.$t('center'),
        Right: this.$t('right'),
        Justify: this.$t('justify'),
        Attach: this.$t('attach'),
        action: this.$t('quick_message'),
      };
    },
  },

  methods: {
    clearAudio() {
      this.$refs.audioRecorder?.discard();
    },
    /**
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
      if (this.isSuggestionBoxOpen) {
        this.keyboardEvent = event;
        return;
      }

      if (event.key === 'Enter') {
        if (event.shiftKey) return;

        this.sendMessage();
        event.preventDefault();
      }
    },

    handlePaste(event) {
      const { items } = event.clipboardData || event.originalEvent.clipboardData;
      const itemsArray = [...items];
      const imagePastes = itemsArray.filter(
        (item) => item.type.includes('image') || item.type === 'video/mp4',
      );

      const fileList = imagePastes.map((imagePaste) => {
        const blob = imagePaste.getAsFile();
        const dateOfPrintPaste = new Date(Date.now()).toUTCString();
        const fileName = blob.name === 'image.png' ? dateOfPrintPaste : blob.name;
        const file = new File([blob], fileName, { type: blob.type });
        return file;
      });

      if (fileList.length) {
        this.openFileUploader(fileList);
      }
    },

    record() {
      if (!this.loading) {
        this.recording = true;
        this.$refs.audioRecorder?.record();
      } else {
        console.log('Loading');
      }
    },
    stopRecord() {
      this.recording = false;
      this.$refs.audioRecorder?.stop();
    },
    send() {
      this.sendMessage();
      this.sendAudio();
    },
    sendMessage() {
      this.$emit('send-message');
    },
    sendAudio() {
      this.$emit('send-audio');
    },
    focusTextEditor() {
      this.$refs.textEditor?.focus?.();
    },
    openFileUploader(files) {
      this.$emit('open-file-uploader', files);
    },
  },
};
</script>

<style lang="scss" scoped>
.message-editor {
  .suggestion-box-container {
    position: relative;

    .suggestion-box {
      margin-bottom: $unnnic-spacing-inline-xs;
      position: absolute;
      bottom: 0;
      left: 0;
    }
  }

  .option {
    color: $unnnic-color-neutral-dark;
    font-size: 0.75rem;
  }
  .attachment-options-container {
    padding: 1rem 0.5rem;
  }
}
</style>
