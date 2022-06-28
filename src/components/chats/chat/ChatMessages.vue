<template>
  <section class="chat-messages">
    <section v-for="room in rooms" :key="room.id" class="chat-messages__room">
      <div v-if="room.agent" class="chat-messages__room__divisor">
        <div class="chat-messages__room__divisor__line" />
        <span class="chat-messages__room__divisor__label"> Chat com {{ room.agent }} </span>
        <div class="chat-messages__room__divisor__line" />
      </div>

      <section class="chat-messages__messages">
        <chat-message
          v-for="message in room.messages"
          :key="message.id"
          :message="message"
          :disabled="chat.closed"
        />
      </section>

      <div v-if="room.closedBy === 'agent'">
        <div class="chat-messages__room__divisor">
          <div class="chat-messages__room__divisor__line" />
          <span class="chat-messages__room__divisor__label"> Chat encerrado pelo agente </span>
          <div class="chat-messages__room__divisor__line" />
        </div>
      </div>

      <div v-if="room.tags">
        <section class="chat-messages__tags">
          <p class="chat-messages__tags__label">Tags do chat</p>
          <tag-group :tags="room.tags" />
        </section>
      </div>

      <div v-if="room.transferredTo" class="chat-messages__room__transfer-info">
        <unnnic-icon icon="logout-1-1" size="sm" scheme="neutral-cleanest" />
        Contato transferido para {{ room.transferredTo }}
      </div>
    </section>

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
import TagGroup from '@/components/TagGroup';
import ChatMessage from './ChatMessage';

export default {
  name: 'ChatMessages',

  components: {
    ChatMessage,
    TagGroup,
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

  computed: {
    rooms() {
      const { rooms, messages } = this.chat;
      return rooms?.length > 0 ? rooms : [{ messages }];
    },
  },

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
  &__room {
    & + & {
      margin-top: $unnnic-spacing-inline-md;
    }

    &__divisor {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-stack-xl;
      margin-bottom: $unnnic-inline-md;

      &__label {
        font-size: $unnnic-font-size-body-md;
        line-height: 1.25rem;
        color: $unnnic-color-neutral-cloudy;
      }

      &__line {
        flex: 1;
        height: 1px;
        background: $unnnic-color-neutral-soft;
      }
    }

    &__transfer-info {
      text-align: center;
      font-size: $unnnic-font-size-body-md;
      line-height: 1.25rem;
      color: $unnnic-color-neutral-cleanest;
    }
  }

  &__messages {
    margin-bottom: $unnnic-spacing-inline-md;
  }

  &__tags {
    margin-bottom: $unnnic-spacing-inline-md;
    &__label {
      font-size: $unnnic-font-size-body-gt;
      color: $unnnic-color-neutral-dark;
      margin-bottom: $unnnic-spacing-inline-sm;
    }
  }
}
</style>
