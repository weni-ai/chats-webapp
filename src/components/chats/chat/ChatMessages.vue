<template>
  <section class="chat-messages">
    <div class="chat-begin">Início da conversa</div>

    <div class="divisor">
      <hr />
      <span class="date"> 20 de dezembro </span>
      <hr />
    </div>

    <div v-for="message in chat.messages" :key="message.id" class="message">
      <span>
        <user-avatar
          size="xs"
          :class="{ clickable: message.username !== 'Atendente' }"
          @click="showContactInfo(message.username)"
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

        <div v-for="element in message.content" :key="element" class="messages">
          <p>{{ element }}</p>
        </div>
      </div>
    </div>
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

    hr {
      flex: 1;
      height: 0.125rem;
      border-color: $unnnic-color-neutral-lightest;
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
      gap: 1rem;
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
