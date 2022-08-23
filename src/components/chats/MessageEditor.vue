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
          @select="(message = $event.preview), focusTextEditor()"
        />
      </div>
    </div>

    <div class="message-editor">
      <unnnic-text-editor
        v-model="message"
        @send="send"
        @keydown="onKeyDown"
        @action="$emit('show-quick-messages')"
        @record-audio="record"
        ref="textEditor"
      >
        <template #footer-input>
          <unnnic-audio-recorder
            v-show="isAudioRecorderVisible"
            v-model="recordedAudio"
            can-delete
            ref="audioRecorder"
          />
        </template>

        <template #attachment-options>
          <div class="attachment-options-container">
            <unnnic-dropdown-item>
              <span
                class="upload-dropdown-option"
                @click="open('media')"
                @keypress.enter="open('media')"
              >
                <unnnic-icon-svg icon="video-file-mp4-1" />
                <span> {{ $t('send_photo_or_video') }} </span>
              </span>
            </unnnic-dropdown-item>
            <unnnic-dropdown-item>
              <span
                class="upload-dropdown-option"
                @click="open('document')"
                @keypress.enter="open('document')"
              >
                <unnnic-icon-svg icon="upload-bottom-1" />
                <span> {{ $tc('send_docs') }} </span>
              </span>
            </unnnic-dropdown-item>
          </div>
        </template>
      </unnnic-text-editor>

      <file-uploader v-model="files" ref="fileUploader" @upload="upload" />
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
    audio: {
      type: HTMLAudioElement,
      default: null,
    },
    value: {
      type: String,
      default: '',
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
    record() {
      this.recording = true;
      this.$refs.audioRecorder?.record();
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

  .attachment-options-container {
    padding: 1rem 0.5rem;
  }
}
</style>
