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
        @action-quick-messages="$emit('show-quick-messages')"
        @action-attachment="open('media')"
      />

      <file-uploader v-model="files" ref="fileUploader" @upload="upload" />
    </div>
  </section>
</template>

<script>
import TextBox from './TextBox';
import FileUploader from './FileUploader';
import SuggestionBox from './SuggestionBox.vue';

export default {
  name: 'MessageEditor',

  components: {
    TextBox,
    FileUploader,
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
    files: [],
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
    upload() {
      this.$emit('upload', [...this.files]);
    },
    focusTextEditor() {
      this.$refs.textEditor?.focus?.();
    },
    open(fileType) {
      this.$refs.fileUploader.open(fileType);
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
