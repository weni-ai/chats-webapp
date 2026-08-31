<!-- This component was migrated from unnnic. -->
<template>
  <section
    class="unnnic-chats-message-wrapper"
    :class="{
      sent: type === 'sent',
      received: type === 'received',
      'is-replyable': canReply,
    }"
    data-testid="message-wrapper"
    @mouseover="isHovering = true"
    @mouseleave="isHovering = false"
    @click="handleMessageClick"
  >
    <section
      class="unnnic-chats-message"
      :class="{
        sent: type === 'sent',
        automatic: automatic,
        sending: status === 'sending',
        'is-document': isDocument,
        'is-media': isMedia,
        'is-image': isImage,
        'is-video': isVideo,
        'is-geo': isGeolocation,
        highlighted: highlighted,
      }"
    >
      <ReplyMessage
        v-if="replyMessage"
        class="unnnic-chats-message__reply-message"
        :replyMessage="replyMessage"
        :messageType="type"
        data-testid="reply-message"
        @click.stop="$emit('click-reply-message')"
      />
      <p
        v-if="signature"
        class="unnnic-chats-message__signature"
      >
        {{ signature }}
      </p>
      <main
        class="unnnic-chats-message__main"
        :class="{
          'is-document': isDocument,
          'is-media': isMedia,
          'is-image': isImage,
          'is-video': isVideo,
          'is-geo': isGeolocation,
        }"
      >
        <UnnnicIcon
          v-if="isGeolocation"
          class="geolocation-icon"
          icon="location_on"
          size="avatar-nano"
        />
        <ChatsMessageText
          v-if="isText"
          :text="slotText"
          :isAutomatic="automatic"
          :automaticType="automaticType"
          :bulkMessageSender="bulkMessageSender"
        />
        <div
          v-if="isDocument"
          class="unnnic-chats-message__document"
        >
          <UnnnicIconLoading
            v-if="status === 'sending'"
            scheme="fg-base"
            size="lg"
          />
          <UnnnicIcon
            v-else-if="status === 'failed'"
            icon="upload"
            scheme="fg-base"
            size="lg"
          />
          <UnnnicIcon
            v-else
            icon="article"
            scheme="fg-base"
            size="lg"
          />
          <p
            class="unnnic-chats-message__document__text"
            @click="onDocumentClick"
          >
            {{ documentName }}
          </p>
        </div>
        <div
          v-else-if="isMedia && !isGeolocation"
          class="unnnic-chats-message__media__container"
          :class="{ failed: failedToSendMedia }"
          @click="onClickMedia"
        >
          <slot />
          <ChatsMessageStatusBackdrop
            v-if="(sendingMedia || failedToSendMedia) && (isImage || isVideo)"
            :status="status"
            @click.stop="status === 'failed' ? $emit('click') : () => {}"
          />
        </div>

        <UnnnicIconLoading
          v-if="sendingMedia"
          size="avatar-nano"
          scheme="fg-base"
        />

        <section class="unnnic-chats-message__time-container">
          <p class="unnnic-chats-message__time">
            {{ formattedTime }}
          </p>
          <UnnnicIcon
            v-if="type === 'sent'"
            :icon="messageStatusIcon"
            size="sm"
            :scheme="status === 'read' ? 'fg-info' : 'fg-muted'"
          />
        </section>
      </main>
    </section>

    <section
      v-if="showReplyButton"
      class="unnnic-chats-message__reply-action"
      data-testid="reply-action"
    >
      <UnnnicToolTip
        enabled
        :text="$t('reply')"
        side="top"
      >
        <button
          type="button"
          class="unnnic-chats-message__reply-button"
          data-testid="reply-icon"
          @click.stop="$emit('reply')"
        >
          <UnnnicIcon
            icon="reply"
            scheme="fg-emphasized"
            size="sm"
          />
        </button>
      </UnnnicToolTip>
    </section>
  </section>
</template>

<script>
import ChatsMessageStatusBackdrop from './MessageStatusBackdrop.vue';
import ChatsMessageText from './MessageText.vue';
import ReplyMessage from './ReplyMessage.vue';

export default {
  name: 'UnnnicChatsMessage',
  components: {
    ChatsMessageStatusBackdrop,
    ChatsMessageText,
    ReplyMessage,
  },
  props: {
    enableReply: {
      type: Boolean,
      default: false,
    },
    replyMessage: {
      type: [Object, null],
      default: null,
    },
    type: {
      type: String,
      default: 'received',
      validate(type) {
        return ['received', 'sent'].includes(type);
      },
    },
    automatic: {
      type: Boolean,
      default: false,
    },
    automaticType: {
      type: String,
      default: 'automatic_open',
    },
    bulkMessageSender: {
      type: String,
      default: '',
    },
    time: {
      type: Date,
      required: true,
    },
    signature: {
      type: String,
      default: '',
    },
    documentName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'sent',
      validate(status) {
        return ['sending', 'sent', 'failed', 'received', 'read'].includes(
          status,
        );
      },
    },
    mediaType: {
      type: String,
      default: '',
      validate(status) {
        return ['audio', 'image', 'video', 'geo'].includes(status);
      },
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['click', 'click-image', 'reply', 'click-reply-message'],

  data() {
    return {
      isHovering: false,
    };
  },

  computed: {
    canReply() {
      return this.enableReply && !['sending', 'failed'].includes(this.status);
    },
    showReplyButton() {
      return this.canReply && this.isHovering;
    },
    formattedTime() {
      const date = new Date(this.time);
      const hours = date.getHours();
      let minutes = date.getMinutes();

      if (minutes < 10) {
        minutes = `0${minutes}`;
      }

      const formattedTime = `${hours}:${minutes}`;
      return formattedTime;
    },
    isMedia() {
      return !!this.mediaType;
    },
    isDocument() {
      return !!this.documentName;
    },
    isText() {
      const validText = !this.isMedia || this.isGeolocation;
      return validText && !this.isDocument;
    },
    isImage() {
      return this.isMedia && this.mediaType === 'image';
    },
    isVideo() {
      return this.isMedia && this.mediaType === 'video';
    },
    isGeolocation() {
      return this.isMedia && this.mediaType === 'geo';
    },
    slotText() {
      return (
        this.$slots?.default?.()?.[0]?.children ||
        this.$slots?.text?.()?.[0]?.children ||
        ''
      );
    },
    sendingMedia() {
      return this.isMedia && this.status === 'sending';
    },
    failedToSendMedia() {
      return (this.isImage || this.isVideo) && this.status === 'failed';
    },
    messageStatusIcon() {
      if (this.status === 'sending') return 'history';
      if (this.status === 'failed') return 'error';

      return this.status === 'received' || this.status === 'read'
        ? 'done_all'
        : 'done';
    },
  },

  methods: {
    handleMessageClick() {
      if (this.canReply) {
        this.$emit('reply');
      }
    },
    onDocumentClick(event) {
      if (this.canReply) {
        return;
      }
      event.stopPropagation();
      this.$emit('click');
    },
    onClickMedia(event) {
      if (this.canReply) {
        return;
      }
      if (this.isImage || this.isVideo) {
        event.stopPropagation();
        this.$emit('click-image');
      }
    },
  },
};
</script>

<style scoped lang="scss">
$defaultLineHeight: $unnnic-font-size-body-gt + $unnnic-line-height-medium;

.is-media .unnnic-chats-message__reply-message {
  cursor: pointer;
}

.unnnic-chats-message-wrapper {
  display: flex;
  align-items: center;
  gap: $unnnic-space-1;
  width: fit-content;
  max-width: 100%;

  &.sent {
    flex-direction: row-reverse;
    margin-left: auto;

    .unnnic-chats-message__reply-button {
      :deep(.unnnic-icon),
      :deep(svg) {
        transform: scaleX(-1);
      }
    }
  }

  &.is-replyable {
    cursor: pointer;
  }
}

.unnnic-chats-message {
  width: fit-content;
  min-width: 70px;
  max-width: 460px;

  display: grid;
  gap: $unnnic-space-1;

  border-radius: $unnnic-radius-2;

  padding: $unnnic-space-2 $unnnic-space-4;

  background-color: $unnnic-color-bg-base;

  font: $unnnic-font-body;

  box-shadow: $unnnic-shadow-1;

  &__reply-action {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__reply-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $unnnic-space-1;
    padding: $unnnic-space-3;
    border: none;
    border-radius: $unnnic-radius-2;
    background: transparent;
    cursor: pointer;

    :deep(.unnnic-icon),
    :deep(svg) {
      width: 20px;
      height: 20px;
    }
  }

  &__reply-message {
    cursor: pointer;
    width: 100%;
  }

  &.highlighted {
    border-bottom: $unnnic-space-05 solid $unnnic-color-border-warning;
  }

  &.sent {
    background-color: $unnnic-color-bg-accent-plain;

    &.automatic {
      background-color: $unnnic-color-bg-info;
    }
  }

  &.sending {
    .unnnic-chats-message__text {
      color: $unnnic-color-fg-muted;
    }
  }

  &.is-media {
    padding: $unnnic-space-2;
  }

  &__main {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $unnnic-space-4;

    & > * {
      margin: 0;
    }

    &.is-media {
      &.is-image,
      &.is-video {
        display: grid;
        justify-items: end;

        overflow: hidden;

        .media {
          overflow: hidden;

          border-radius: $unnnic-radius-2;

          min-height: 200px;
          max-height: 300px;
          height: auto;
        }
      }

      &.is-image .media {
        width: 200px;
        height: auto;
        max-width: 200px;

        object-fit: cover;
      }

      &.is-video .media {
        width: 300px;
        max-width: 300px;
      }
    }

    &.is-document {
      min-width: 200px;
      max-width: 400px;
    }
  }

  &__document {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;

    &__text {
      &:hover {
        text-decoration: underline;

        cursor: pointer;
      }
    }
  }

  &__text,
  &__document__text,
  &__signature {
    margin: 0;

    padding: $unnnic-space-1 0;

    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-fg-emphasized;
    line-height: $defaultLineHeight;
    word-break: break-word;
  }

  &__signature {
    padding: 0;

    font-weight: $unnnic-font-weight-bold;
  }

  &__status-time {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: $unnnic-space-1;
    min-width: 51px;
  }

  &__time {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;
    margin: 0;
    padding: 0;

    &-container {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-nano;
      flex-shrink: 0;
    }
  }

  &__media__container {
    position: relative;

    display: flex;

    &.failed {
      cursor: pointer;
    }
  }

  .geolocation-icon {
    align-self: center;
  }
}
</style>
