<template>
  <section>
    <MessageManagerLoading v-show="showSkeletonLoading" />
    <div
      v-show="!showSkeletonLoading"
      class="message-manager"
      data-testid="message-manager"
    >
      <div
        :class="[
          'message-manager-box__container',
          isFileLoadingValueValid && 'loading',
          isFocused && 'focused',
        ]"
        data-testid="message-manager-box-container"
      >
        <LoadingBar
          v-if="isFileLoadingValueValid"
          :value="loadingFileValue"
        />
        <UnnnicReplyMessage
          v-if="replyMessage"
          class="message-manager__reply-message"
          :replyMessage="replyMessage"
          showClose
          messageType="received"
          @close="clearReplyMessage()"
        />
        <TextBox
          v-if="!isAudioRecorderVisible"
          ref="textBox"
          class="message-manager-box__text-box"
          :modelValue="textBoxMessage"
          :isInternalNote="isInternalNote"
          @update:model-value="textBoxMessage = $event"
          @keydown.stop="onKeyDown"
          @paste="handlePaste"
          @is-typing-handler="isTypingHandler"
          @is-focused-handler="isFocusedHandler"
          @handle-quick-messages="emitShowQuickMessages"
          @open-file-uploader="openFileUploader"
          @close-internal-note="handleInternalNoteInput"
        />
        <UnnnicAudioRecorder
          v-show="isAudioRecorderVisible && !isFileLoadingValueValid"
          ref="audioRecorder"
          v-model="audioMessage"
          class="message-manager__audio-recorder"
          @status="updateAudioRecorderStatus"
        />
      </div>
      <div class="message-manager__actions">
        <UnnnicButton
          v-if="
            canUseCopilot && !isCopilotOpen && showActionButton && !discussionId
          "
          type="secondary"
          size="large"
          iconCenter="wb_incandescent"
          class="message-manager__actions__co-pilot"
          @click="openCopilot"
        />
        <UnnnicButton
          v-if="
            (!canUseCopilot || discussionId) &&
            showActionButton &&
            !isInternalNote
          "
          type="secondary"
          size="large"
          iconCenter="mic"
          @click="record"
        />

        <UnnnicButton
          v-if="discussionId && showActionButton"
          type="secondary"
          size="large"
          iconCenter="attachment"
          next
          @click="openFileUploader"
        />

        <UnnnicDropdown
          v-if="
            (showActionButton || isSuggestionBoxOpen) &&
            !discussionId &&
            !isInternalNote
          "
          position="top-left"
          class="more-actions"
        >
          <template #trigger>
            <UnnnicButton
              type="primary"
              size="large"
              iconCenter="add"
            />
          </template>

          <div class="more-actions-container">
            <MoreActionsOption
              v-if="canUseCopilot"
              :action="record"
              icon="mic"
              :title="$t('record_audio')"
            />
            <MoreActionsOption
              :action="openFileUploader"
              icon="attachment"
              :title="$t('attach')"
            />
            <MoreActionsOption
              :action="emitShowQuickMessages"
              icon="bolt"
              :title="$t('quick_message')"
            />
            <MoreActionsOption
              :action="handleInternalNoteInput"
              icon="add_notes"
              :title="$t('internal_note')"
            />
          </div>
        </UnnnicDropdown>

        <UnnnicButton
          v-if="showSendMessageButton"
          :type="isInternalNote ? 'attention' : 'primary'"
          size="large"
          iconCenter="send"
          class="send-message-button"
          @click="send"
        />
        <UnnnicButton
          v-else-if="isMobile"
          type="primary"
          size="large"
          iconCenter="mic"
          @click="record"
        />
      </div>
      <SuggestionBox
        v-if="!discussionId"
        :search="textBoxMessage"
        :suggestions="shortcuts"
        :keyboardEvent="keyboardEvent"
        :copilot="canUseCopilot && !discussionId"
        @open="isSuggestionBoxOpen = true"
        @close="closeSuggestionBox"
        @select="setMessage($event.text)"
        @open-copilot="openCopilot"
      />
      <CoPilot
        v-if="isCopilotOpen"
        ref="copilot"
        @select="setMessage($event)"
        @close="isCopilotOpen = false"
      />
    </div>
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import { mapActions, mapState, mapWritableState } from 'pinia';

import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import MessageManagerLoading from '@/views/loadings/chat/MessageManager.vue';

import TextBox from './TextBox.vue';
import MoreActionsOption from './MoreActionsOption.vue';
import LoadingBar from './LoadingBar.vue';
import SuggestionBox from './SuggestionBox.vue';
import CoPilot from './CoPilot.vue';

export default {
  name: 'MessageManager',

  components: {
    MessageManagerLoading,
    TextBox,
    LoadingBar,
    SuggestionBox,
    MoreActionsOption,
    CoPilot,
  },

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    loadingFileValue: {
      validator: (value) => {
        return value === null || typeof value === 'number';
      },
      default: null,
    },
    showSkeletonLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'show-quick-messages', 'open-file-uploader'],

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
    isInternalNote: false,
  }),

  computed: {
    ...mapState(useQuickMessageShared, ['quickMessagesShared']),
    ...mapState(useQuickMessages, ['quickMessages']),
    ...mapState(useRooms, ['canUseCopilot', 'activeRoom']),
    ...mapState(useDiscussions, {
      discussionId: (store) => store.activeDiscussion?.uuid,
    }),
    ...mapWritableState(useRoomMessages, ['replyMessage']),

    isMobile() {
      return isMobile();
    },

    textBoxMessage: {
      get() {
        return this.modelValue;
      },
      set(textBoxMessage) {
        this.$emit('update:modelValue', textBoxMessage);
      },
    },
    isAudioRecorderVisible() {
      return (
        !!this.audioMessage ||
        ['recording', 'recorded', 'playing', 'paused'].includes(
          this.audioRecorderStatus,
        )
      );
    },
    isFileLoadingValueValid() {
      return typeof this.loadingFileValue === 'number';
    },
    shortcuts() {
      const allShortcuts = [...this.quickMessages, ...this.quickMessagesShared];
      const uniqueShortcuts = [];

      allShortcuts.forEach((item) => {
        const isDuplicate = uniqueShortcuts.some(
          (uniqueItem) => uniqueItem.uuid === item.uuid,
        );

        if (!isDuplicate) {
          uniqueShortcuts.push(item);
        }
      });

      return uniqueShortcuts;
    },
    showActionButton() {
      const {
        isTyping,
        isAudioRecorderVisible,
        isFileLoadingValueValid,
        isMobile,
      } = this;
      return (
        !isTyping &&
        !isAudioRecorderVisible &&
        !isFileLoadingValueValid &&
        !isMobile
      );
    },
    showSendMessageButton() {
      const {
        isSuggestionBoxOpen,
        isTyping,
        isAudioRecorderVisible,
        isFileLoadingValueValid,
        isInternalNote,
      } = this;
      return (
        !isSuggestionBoxOpen &&
        (isTyping ||
          isAudioRecorderVisible ||
          isFileLoadingValueValid ||
          isInternalNote)
      );
    },
  },

  watch: {
    'activeRoom.uuid'() {
      this.clearReplyMessage();
    },
    replyMessage(newReplyMessage) {
      if (newReplyMessage) this.$refs.textBox.focus();
    },
  },

  mounted() {
    this.clearReplyMessage();
  },

  methods: {
    ...mapActions(useDiscussionMessages, [
      'sendDiscussionMessage',
      'sendDiscussionMedias',
    ]),
    ...mapActions(useRoomMessages, [
      'sendRoomMessage',
      'sendRoomMedias',
      'sendRoomInternalNote',
    ]),
    handleInternalNoteInput() {
      this.textBoxMessage = '';
      this.clearReplyMessage();
      this.isInternalNote = !this.isInternalNote;
    },
    openCopilot() {
      this.isCopilotOpen = true;
      this.clearTextBox();
    },
    emitShowQuickMessages() {
      this.$emit('show-quick-messages');
    },
    setMessage(newMessage) {
      this.textBoxMessage = newMessage;
      this.$nextTick(() => {
        this.$refs.textBox.focus();
      });
    },
    clearReplyMessage() {
      this.replyMessage = null;
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
        this.send();
        event.preventDefault();
      }

      if (event.key === 'Escape' && this.isInternalNote) {
        this.handleInternalNoteInput();
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
      const { items } =
        event.clipboardData || event.originalEvent.clipboardData;
      const itemsArray = [...items];
      const imagePastes = itemsArray.filter(
        (item) => item.type.includes('image') || item.type === 'video/mp4',
      );

      const fileList = imagePastes.map((imagePaste) => {
        const blob = imagePaste.getAsFile();
        const dateOfPrintPaste = new Date(Date.now()).toUTCString();
        const fileName =
          blob.name === 'image.png' ? `${dateOfPrintPaste}.png` : blob.name;
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
    async send() {
      if (this.isInternalNote) {
        await this.sendInternalNote();
      } else {
        let repliedMessage = null;
        if (this.replyMessage) {
          repliedMessage = { ...this.replyMessage };
          this.replyMessage = null;
        }
        await this.sendTextBoxMessage(repliedMessage);
        await this.sendAudio(repliedMessage);
      }
      this.$refs.textBox?.clearTextarea();
    },
    async sendInternalNote() {
      if (!this.textBoxMessage.trim()) return;
      const text = `${this.$t('internal_note')}: ${this.textBoxMessage.trim()}`;
      this.clearTextBox();
      await this.sendRoomInternalNote({ text });
      this.handleInternalNoteInput();
    },
    async sendTextBoxMessage(repliedMessage) {
      const message = this.textBoxMessage.trim();
      if (message) {
        this.clearTextBox();
        if (this.discussionId) {
          await this.sendDiscussionMessage(message);
        } else {
          await this.sendRoomMessage(message, repliedMessage);
        }
      }
    },
    async sendAudio(repliedMessage) {
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
      const audio = new File([blob], `${Date.now().toString()}.mp3`, {
        type: 'audio/mpeg3',
      });

      const sendPayload = {
        files: [audio],
        updateLoadingFiles,
        repliedMessage,
      };

      if (this.discussionId) {
        await this.sendDiscussionMedias(sendPayload);
      } else {
        await this.sendRoomMedias(sendPayload);
      }

      this.totalValue = undefined;
      this.clearAudio();

      this.isLoading = false;
    },
    openFileUploader(files, filesType) {
      this.$emit(
        'open-file-uploader',
        files?.length > 0 ? files : [],
        filesType,
      );
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

  :deep(.reply-message) {
    box-shadow: 0px 2px 5px -1px rgba(0, 0, 0, 0.1);
  }

  :deep(.send-message-button.unnnic-button--attention) {
    background-color: $unnnic-color-feedback-yellow;
  }

  &-box {
    &__container {
      position: relative;

      height: 100%;

      display: flex;
      flex-direction: column;
      gap: $unnnic-spacing-nano;

      &.focused {
        border-color: $unnnic-color-neutral-clean;
      }

      &.loading {
        border-radius: 0 0 $unnnic-border-radius-sm $unnnic-border-radius-sm;
      }

      &.recording {
        border: $unnnic-border-width-thinner solid
          $unnnic-color-neutral-cleanest;
        border-radius: $unnnic-border-radius-sm;
        background-color: $unnnic-color-neutral-snow;
      }
    }
  }

  &__actions {
    margin-right: $unnnic-spacing-inline-sm;

    display: flex;
    gap: $unnnic-spacing-stack-xs;

    &__co-pilot {
      rotate: 180deg;
    }

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

    padding: 10px;

    border: $unnnic-border-width-thinner solid $unnnic-color-neutral-cleanest;
    border-radius: $unnnic-border-radius-sm;
    background-color: $unnnic-color-neutral-snow;

    :deep(.audio-player) {
      width: auto;
    }
  }
}
</style>
