<template>
  <section>
    <div class="message-manager">
      <div
        :class="[
          'message-manager-box__container',
          isLoadingValueValid && 'loading',
          isFocused && 'focused',
        ]"
      >
        <div v-if="isLoadingValueValid" class="loading-indicator__container">
          <div
            class="loading-indicator"
            :style="{ width: `${(loadingFileValue || loadingValue) * 100}%` }"
          ></div>
        </div>
        <text-box
          v-if="!isAudioRecorderVisible"
          ref="textBox"
          v-model="textBoxMessage"
          @keydown="onKeyDown"
          @paste="handlePaste"
          @is-typing-handler="isTypingHandler"
          @is-focused-handler="isFocusedHandler"
        />
        <unnnic-audio-recorder
          ref="audioRecorder"
          class="message-manager__audio-recorder"
          v-show="isAudioRecorderVisible && !isLoadingValueValid"
          v-model="audioMessage"
          @status="updateAudioRecorderStatus"
        />
      </div>
      <div class="message-manager__actions">
        <unnnic-button
          v-if="canUseCopilot && !isCopilotOpen && showActionButton"
          @click="openCopilot"
          type="secondary"
          size="large"
          iconCenter="study-light-idea-1"
        />
        <unnnic-button
          v-if="!canUseCopilot && showActionButton"
          @click="record"
          type="secondary"
          size="large"
          iconCenter="microphone"
        />

        <unnnic-dropdown
          v-if="showActionButton || isSuggestionBoxOpen"
          position="top-left"
          class="more-actions"
        >
          <unnnic-button slot="trigger" type="primary" size="large" iconCenter="add-1" />

          <div class="more-actions-container">
            <more-actions-option
              v-if="canUseCopilot"
              :action="record"
              icon="microphone"
              :title="$t('record_audio')"
            />
            <more-actions-option
              :action="openFileUploader"
              icon="attachment"
              :title="$t('attach')"
            />
            <more-actions-option
              :action="() => $emit('show-quick-messages')"
              icon="flash-1-4"
              :title="$t('quick_message')"
            />
          </div>
        </unnnic-dropdown>

        <unnnic-button
          v-if="!isSuggestionBoxOpen && (isTyping || isAudioRecorderVisible || isLoadingValueValid)"
          @click="send"
          type="primary"
          size="large"
          iconCenter="send-email-3-1"
        />
      </div>
      <suggestion-box
        :search="textBoxMessage"
        :suggestions="shortcuts"
        :keyboard-event="keyboardEvent"
        :copilot="canUseCopilot"
        @open="isSuggestionBoxOpen = true"
        @close="closeSuggestionBox"
        @select="setMessage($event.text)"
        @open-copilot="openCopilot"
      />
      <co-pilot
        v-if="isCopilotOpen"
        ref="copilot"
        @select="setMessage($event)"
        @close="isCopilotOpen = false"
      />
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';

import TextBox from './TextBox';
import MoreActionsOption from './MoreActionsOption.vue';
import SuggestionBox from './SuggestionBox.vue';
import CoPilot from './CoPilot';

export default {
  name: 'MessageManager',

  components: {
    TextBox,
    SuggestionBox,
    MoreActionsOption,
    CoPilot,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
    loadingFileValue: {
      type: Number,
    },
  },

  data: () => ({
    keyboardEvent: null,
    isSuggestionBoxOpen: false,
    isCopilotOpen: false,
    isTyping: false,
    isFocused: false,

    /**
     * @type {HTMLAudioElement}
     */
    audioMessage: null,
    audioRecorderStatus: '',
    isLoading: false,
    loadingValue: null,
  }),

  computed: {
    ...mapState({
      quickMessages: (state) => state.chats.quickMessages.quickMessages,
      quickMessagesShared: (state) => state.chats.quickMessagesShared.quickMessagesShared,
      canUseCopilot: (state) => state.chats.rooms.canUseCopilot,
      discussionId: (state) => state.chats.discussions.activeDiscussion?.uuid,
    }),

    textBoxMessage: {
      get() {
        return this.value;
      },
      set(textBoxMessage) {
        this.$emit('input', textBoxMessage);
      },
    },
    isAudioRecorderVisible() {
      return (
        !!this.audioMessage ||
        ['recording', 'recorded', 'playing', 'paused'].includes(this.audioRecorderStatus)
      );
    },
    isLoadingValueValid() {
      return typeof this.loadingValue === 'number' || typeof this.loadingFileValue === 'number';
    },
    shortcuts() {
      const allShortcuts = [...this.quickMessages, ...this.quickMessagesShared];
      const uniqueShortcuts = [];

      allShortcuts.forEach((item) => {
        const isDuplicate = uniqueShortcuts.some((uniqueItem) => uniqueItem.uuid === item.uuid);

        if (!isDuplicate) {
          uniqueShortcuts.push(item);
        }
      });

      return uniqueShortcuts;
    },
    showActionButton() {
      const { isTyping, isAudioRecorderVisible, isLoadingValueValid } = this;
      return !isTyping && !isAudioRecorderVisible && !isLoadingValueValid;
    },
  },

  methods: {
    openCopilot() {
      this.isCopilotOpen = true;
      this.clearTextBox();
    },
    setMessage(newMessage) {
      this.textBoxMessage = newMessage;
      this.$nextTick(() => {
        this.$refs.textBox.focus();
      });
    },
    clearAudio() {
      this.$refs.audioRecorder?.discard();
      this.audioMessage = null;
    },
    clearTextBox() {
      this.textBoxMessage = '';
    },
    /**
     * @param {KeyboardEvent} event
     */
    closeSuggestionBox() {
      this.isSuggestionBoxOpen = false;

      if (this.textBoxMessage.startsWith('/')) {
        this.textBoxMessage = '';
      }
    },
    onKeyDown(event) {
      if (this.isSuggestionBoxOpen) {
        if (event.key === 'Escape') {
          this.closeSuggestionBox();
          return;
        }

        this.keyboardEvent = event;
        return;
      }

      if (event.key === 'Enter') {
        if (event.shiftKey) return;

        this.sendTextBoxMessage();
        event.preventDefault();
      }
    },
    isTypingHandler(isTyping = false) {
      this.isTyping = isTyping;
    },
    isFocusedHandler(isFocused = false) {
      this.isFocused = isFocused;
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
      if (!this.isLoading) {
        this.$refs.audioRecorder?.record();
      } else {
        console.info('Loading');
      }
    },
    stopRecord() {
      this.$refs.audioRecorder?.stop();
    },
    send() {
      this.$refs.textBox?.clearTextarea();
      this.sendTextBoxMessage();
      this.sendAudio();
    },
    async sendTextBoxMessage() {
      const message = this.textBoxMessage.trim();
      if (message) {
        this.clearTextBox();

        const actionType = this.discussionId
          ? 'chats/discussionMessages/sendDiscussionMessage'
          : 'chats/roomMessages/sendRoomMessage';

        await this.$store.dispatch(actionType, message);
      }
    },
    async sendAudio() {
      if (this.audioRecorderStatus === 'recording') {
        await this.stopRecord();
      }

      if (!this.audioMessage || this.isLoading) return;
      this.isLoading = true;

      const loadingFiles = {};
      const updateLoadingFiles = (messageUuid, progress) => {
        loadingFiles[messageUuid] = progress;
        this.totalValue =
          Object.values(loadingFiles).reduce((acc, value) => acc + value) /
          Object.keys(loadingFiles).length;
      };
      const response = await fetch(this.audioMessage.src);
      const blob = await response.blob();
      const audio = new File([blob], `${Date.now().toString()}.mp3`, { type: 'audio/mpeg3' });

      const actionType = this.discussionId
        ? 'chats/discussionMessages/sendDiscussionMedias'
        : 'chats/roomMessages/sendRoomMedias';

      await this.$store.dispatch(actionType, {
        files: [audio],
        updateLoadingFiles,
      });

      this.totalValue = undefined;
      this.clearAudio();

      this.isLoading = false;
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
.message-manager {
  position: relative;

  display: grid;
  grid-template-columns: 1fr auto;
  gap: $unnnic-spacing-stack-xs;
  align-items: end;

  &-box__container {
    position: relative;

    border: $unnnic-border-width-thinner solid $unnnic-color-neutral-cleanest;
    border-radius: $unnnic-border-radius-sm;
    background-color: $unnnic-color-neutral-snow;

    height: 100%;

    &.focused {
      border-color: $unnnic-color-neutral-clean;
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

        background-color: rgba($unnnic-color-neutral-clean, $unnnic-opacity-level-light);

        overflow: hidden;

        .loading-indicator {
          height: $unnnic-border-width-thin;

          background-color: $unnnic-color-neutral-clean;
          transition: width 0.2s;
        }
      }
    }
  }

  &__actions {
    margin-right: $unnnic-spacing-inline-sm;

    display: flex;
    gap: $unnnic-spacing-stack-xs;

    .more-actions {
      :deep(.unnnic-dropdown__content) {
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
