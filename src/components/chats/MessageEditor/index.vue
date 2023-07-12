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
      <div
        :class="[
          'message-editor-box__container',
          loadingValue !== undefined && 'loading',
          isTyping && 'typing',
        ]"
      >
        <div v-if="loadingValue !== undefined" class="loading-indicator__container">
          <div class="loading-indicator" :style="{ width: `${loadingValue * 100}%` }"></div>
        </div>
        <text-box
          v-if="!isAudioRecorderVisible"
          ref="textBox"
          v-model="message"
          @keydown="onKeyDown"
          @paste="handlePaste"
          @is-typing-handler="isTypingHandler"
          :loadingValue="loadingValue"
        />
        <unnnic-audio-recorder
          ref="audioRecorder"
          class="message-editor__audio-recorder"
          v-show="isAudioRecorderVisible && loadingValue === undefined"
          v-model="recordedAudio"
          @status="updateAudioRecorderStatus"
        />
      </div>
      <div class="message-editor__actions">
        <unnnic-button-icon
          v-if="!isTyping && !isAudioRecorderVisible"
          @click="record"
          type="secondary"
          size="large"
          icon="microphone"
        />

        <unnnic-dropdown
          v-if="!isTyping && !isAudioRecorderVisible"
          position="top-left"
          class="more-actions"
        >
          <unnnic-button-icon slot="trigger" type="primary" size="large" icon="add-1" />

          <div class="more-actions-container">
            <more-actions-option
              :action="() => $emit('show-quick-messages')"
              icon="flash-1-4"
              :title="$t('quick_message')"
            />
            <!-- <more-actions-option
            :action="() => {}"
            icon="study-light-idea-1"
            :title="$t('suggested_answers')"
          /> -->
            <more-actions-option
              :action="openFileUploader"
              icon="attachment"
              :title="$t('attach')"
            />
          </div>
        </unnnic-dropdown>

        <unnnic-button-icon
          v-if="isTyping || isAudioRecorderVisible"
          @click="send"
          type="primary"
          size="large"
          icon="send-email-3-1"
        />
      </div>
    </div>
  </section>
</template>

<script>
import TextBox from './TextBox';
import MoreActionsOption from './MoreActionsOption.vue';
import SuggestionBox from './SuggestionBox.vue';

export default {
  name: 'MessageEditor',

  components: {
    TextBox,
    SuggestionBox,
    MoreActionsOption,
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
    audioRecorderStatus: '',
    isTyping: false,
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
      return (
        !!this.audio ||
        ['recording', 'recorded', 'playing', 'paused'].includes(this.audioRecorderStatus)
      );
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
    isTypingHandler(isTyping = false) {
      this.isTyping = isTyping;
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
        const fileName = blob.name === 'image.png' ? `${dateOfPrintPaste}.png` : blob.name;
        const file = new File([blob], fileName, { type: blob.type });
        return file;
      });

      if (fileList.length) {
        this.openFileUploader(fileList);
      }
    },

    record() {
      if (!this.loading) {
        this.$refs.audioRecorder?.record();
      } else {
        console.log('Loading');
      }
    },
    stopRecord() {
      this.$refs.audioRecorder?.stop();
    },
    send() {
      this.$refs.textBox?.clearTextarea();
      this.sendMessage();
      this.sendAudio();
    },
    sendMessage() {
      this.$emit('send-message');
    },
    async sendAudio() {
      if (this.audioRecorderStatus === 'recording') {
        await this.stopRecord();
      }
      this.$emit('send-audio');
    },
    focusTextEditor() {
      this.$refs.textEditor?.focus?.();
    },
    openFileUploader(files) {
      this.$emit('open-file-uploader', files);
    },
    updateAudioRecorderStatus(status) {
      this.audioRecorderStatus = status;
    },
  },
};
</script>

<style lang="scss" scoped>
.message-editor {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: $unnnic-spacing-stack-xs;
  align-items: end;

  .suggestion-box-container {
    position: relative;

    .suggestion-box {
      margin-bottom: $unnnic-spacing-inline-xs;
      position: absolute;
      bottom: 0;
      left: 0;
    }
  }

  // .option {
  //   color: $unnnic-color-neutral-dark;
  //   font-size: 0.75rem;
  // }
  // .attachment-options-container {
  //   padding: 1rem 0.5rem;
  // }

  &-box__container {
    position: relative;
    border: $unnnic-border-width-thinner solid $unnnic-color-neutral-clean;
    border-radius: $unnnic-border-radius-sm;
    background-color: $unnnic-color-neutral-snow;
    height: 100%;

    &.typing {
      border-color: $unnnic-color-neutral-cleanest;
    }

    &.loading {
      border-radius: 0 0 $unnnic-border-radius-sm $unnnic-border-radius-sm;

      .loading-indicator__container {
        position: absolute;
        top: 0;
        z-index: 100;
        grid-area: loading;
        width: 100%;
        height: $unnnic-border-width-thin;
        overflow: hidden;
        background-color: rgba($unnnic-color-neutral-cleanest, $unnnic-opacity-level-light);

        .loading-indicator {
          height: $unnnic-border-width-thin;
          background-color: $unnnic-color-neutral-cleanest;
          transition: width 0.2s;
        }
      }
    }
  }

  &__actions {
    display: flex;
    gap: $unnnic-spacing-stack-xs;

    .more-actions {
      ::v-deep .unnnic-dropdown__content {
        padding: 0 $unnnic-spacing-inset-sm;
      }
    }
  }

  &__audio-recorder {
    width: 100%;
    height: 100%;
    justify-content: flex-end;

    padding-right: $unnnic-spacing-stack-sm;
  }
}
</style>
