<template>
  <div class="message-group">
    <span>
      <user-avatar
        :username="message.username"
        :clickable="message.username !== 'Agente'"
        @click="showContactInfo(message.username)"
        :disabled="disabled"
      />
    </span>

    <div class="messages">
      <div class="info">
        <span
          class="username"
          :class="{ clickable: message.username !== 'Agente' }"
          @click="showContactInfo(message.username)"
          @keypress.enter="showContactInfo(message.username)"
        >
          {{ message.username }}
        </span>
        <span class="time">{{ message.time }}</span>
      </div>

      <div
        v-for="content in message.content"
        :key="content.text || content.filename || content.audio.src"
        class="message"
      >
        <media-message v-if="content.isMedia" :media="content" />
        <span v-else-if="content.isAudio">
          <unnnic-audio-recorder :src="content.audio.src" />
        </span>

        <p v-else :class="{ 'unsent-message': content.sent === false, disabled }">
          {{ content.text }}
          <unnnic-tool-tip
            v-if="content.sent === false"
            enabled
            text="Clique para reenviar"
            side="right"
          >
            <span
              @click="messageToResend = content"
              @keypress.enter="messageToResend = content"
              class="resend-button"
            >
              <unnnic-icon-svg
                icon="synchronize-arrow-clock-5"
                scheme="feedback-red"
                size="sm"
                clickable
              />
            </span>
          </unnnic-tool-tip>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar';
import MediaMessage from '@/components/chats/MediaMessage';

export default {
  components: {
    MediaMessage,
    UserAvatar,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.message-group {
  display: flex;
  gap: $unnnic-spacing-stack-sm;

  & + .message-group {
    padding-top: $unnnic-spacing-inset-md;
  }

  .messages {
    .info {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-stack-xs;
      margin-bottom: $unnnic-spacing-inline-xs;

      .username {
        font-weight: $unnnic-font-weight-regular;
        line-height: 1.5rem;
        color: $unnnic-color-neutral-dark;
      }

      .time {
        font-size: $unnnic-font-size-body-gt;
        color: $unnnic-color-brand-sec;
      }
    }

    .message {
      & + .message {
        padding-top: $unnnic-spacing-inset-nano;
      }

      & .unsent-message {
        color: $unnnic-color-neutral-clean;

        & .resend-button {
          display: inline-flex;
          align-items: center;
          margin-left: $unnnic-spacing-inline-xs;
        }
      }

      & p {
        font-size: $unnnic-font-size-body-gt;
        color: $unnnic-color-neutral-dark;
      }
    }
  }
}
</style>
