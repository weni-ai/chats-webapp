<template>
  <section class="chat-messages">
    <div class="chat-begin">Início da conversa</div>

    <div class="divisor">
      <div class="line" />
      <span class="date"> 20 de dezembro </span>
      <div class="line" />
    </div>

    <div v-for="message in chat.messages" :key="message.id" class="message-group">
      <span>
        <user-avatar
          :username="message.username"
          :clickable="message.username !== 'Agente'"
          @click="showContactInfo(message.username)"
          :disabled="chat.closed"
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
          :key="content.text || content.filename"
          class="message"
        >
          <media-message v-if="content.isMedia" :media="content" />

          <p v-else :class="{ 'unsent-message': content.sent === false }">
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
                <unnnic-icon
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

    <unnnic-modal
      :showModal="!!messageToResend"
      modalIcon="alert-circle-1"
      text="Mensagem não enviada"
      description="Sua mensagem não foi enviada. Deseja reenviar?"
      @close="messageToResend = null"
    >
      <template #options>
        <unnnic-button type="terciary" @click="messageToResend = null" text="Cancelar envio" />
        <unnnic-button
          @click="(messageToResend.sent = true), (messageToResend = null)"
          text="Reenviar"
        />
      </template>
    </unnnic-modal>
  </section>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar';
import MediaMessage from '@/components/chats/MediaMessage';

export default {
  name: 'ChatMessages',

  components: {
    MediaMessage,
    UserAvatar,
  },

  props: {
    chat: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    messageToResend: null,
  }),

  methods: {
    showContactInfo(username) {
      if (username === 'Agente') return;

      this.$emit('show-contact-info');
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-messages {
  .chat-begin {
    text-align: center;
    color: $unnnic-color-neutral-dark;
    line-height: 1.375rem;
    font-weight: $unnnic-font-weight-regular;
    font-size: $unnnic-font-size-body-gt;
  }

  .divisor {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-md;
    margin: $unnnic-inline-xs 0 $unnnic-inline-sm;

    .date {
      font-weight: $unnnic-font-weight-bold;
      font-size: $unnnic-font-size-body-sm;
      line-height: 1rem;
      color: $unnnic-color-neutral-dark;
    }

    .line {
      flex: 1;
      height: 0.125rem;
      background: $unnnic-color-neutral-lightest;
    }
  }

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
}
</style>
