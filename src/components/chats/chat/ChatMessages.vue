<template>
  <section class="chat-messages">
    <div class="chat-begin">Início da conversa</div>

    <div class="divisor">
      <div class="line" />
      <span class="date"> 20 de dezembro </span>
      <div class="line" />
    </div>

    <div v-for="message in chat.messages" :key="message.id" class="message">
      <span>
        <user-avatar
          :username="message.username"
          :clickable="message.username !== 'Atendente'"
          @click="showContactInfo(message.username)"
          :disabled="chat.closed"
        />
      </span>

      <div>
        <div class="info">
          <span
            class="username"
            :class="{ clickable: message.username !== 'Atendente' }"
            @click="showContactInfo(message.username)"
            @keypress.enter="showContactInfo(message.username)"
          >
            {{ message.username }}
          </span>
          <span class="time">{{ message.time }}</span>
        </div>

        <div v-for="content in message.content" :key="content.text" class="messages">
          <p :class="{ 'unsent-message': content.sent === false }">
            {{ content.text }}
            <span
              v-if="content.sent === false"
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
import UserAvatar from '@/components/UserAvatar';

export default {
  name: 'ChatMessages',

  components: {
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
      if (username === 'Atendente') return;

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
    font-weight: 400;
    font-size: 0.875rem;
  }

  .divisor {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin: 0.5rem 0 1rem;

    .date {
      font-weight: 700;
      font-size: 0.5rem;
      line-height: 1rem;
      color: $unnnic-color-neutral-dark;
    }

    .line {
      flex: 1;
      height: 0.125rem;
      background: $unnnic-color-neutral-lightest;
    }
  }

  .message {
    display: flex;
    gap: 1rem;

    & + .message {
      padding-top: 1.5rem;
    }

    .info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .username {
        font-weight: 400;
        line-height: 1.5rem;
        color: $unnnic-color-neutral-dark;
      }

      .time {
        font-size: 0.875rem;
        color: $unnnic-color-brand-sec;
      }
    }

    .messages {
      & .unsent-message {
        color: $unnnic-color-neutral-clean;

        & .resend-button {
          display: inline-flex;
          align-items: center;
          margin-left: 0.5rem;
        }
      }

      & > * {
        font-size: 0.875rem;
        line-height: 1.375rem;
        color: $unnnic-color-neutral-dark;

        & + * {
          padding-top: 0.5rem;
        }
      }
    }
  }

  .clickable {
    cursor: pointer;
  }
}
</style>
