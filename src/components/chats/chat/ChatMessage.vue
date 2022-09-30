<template>
  <div class="message-group">
    <span>
      <user-avatar
        :username="message.sender.name"
        :clickable="isContactMessage"
        @click="showContactInfo"
        :disabled="disabled"
        :photo-url="usePhoto ? message.sender.photo_url : ''"
      />
    </span>

    <div class="messages">
      <div class="info">
        <span
          class="username"
          :class="{ clickable: isContactMessage }"
          @click="showContactInfo"
          @keypress.enter="showContactInfo"
        >
          {{ message.sender.name }}
        </span>
        <span class="time">{{ sendingTime }}</span>
      </div>

      <div
        v-for="content in message.content"
        :key="content.uuid || content.text || content.filename || content.audio.src"
        class="message"
      >
        <section class="message__medias" v-if="content.media.length > 0">
          <media-message v-for="media in content.media" :key="media.url" :media="media" />
          <span v-if="content.isAudio">
            <unnnic-audio-recorder :src="content.audio.src" />
          </span>
        </section>

        <p v-else :class="{ 'unsent-message': content.sent === false, disabled }">
          {{ content.text }}
          <unnnic-tool-tip
            v-if="content.sent === false"
            enabled
            :text="$t('click_to_resend')"
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
    usePhoto: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    isContactMessage() {
      return !!this.message.contact;
    },
    sendingTime() {
      const date = new Date(this.message.created_on);
      const formatter = Intl.DateTimeFormat('pt-BR', {
        timeStyle: 'short',
      });
      const time = formatter.format(date);
      return time.replace(':', 'h');
    },
  },

  methods: {
    showContactInfo() {
      if (this.isContactMessage) this.$emit('show-contact-info');
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

      &__medias {
        display: flex;
        flex-direction: column;
      }
    }
  }
}
</style>
