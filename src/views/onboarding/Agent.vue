<template>
  <chats-layout>
    <template #room-list>
      <section class="room-list">
        <div class="room-list__rooms">
          <room-group :label="$t('chats.in_progress')" :rooms="[room]" use-photo />
        </div>
      </section>
    </template>

    <section class="room">
      <chat-header :room="room" :closeButtonTooltip="$t('chats.end')" @close="() => {}" use-photo />
      <chat-messages
        :room="room"
        :messages="messages"
        class="messages"
        ref="chatMessages"
        use-photo
      />
    </section>
  </chats-layout>
</template>

<script>
import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import RoomGroup from '@/layouts/ChatsLayout/components/TheRoomList/RoomGroup';

import ChatsLayout from '@/layouts/ChatsLayout';

import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';

export default {
  name: 'AgentOnboarding',

  components: {
    ChatsLayout,
    ChatHeader,
    ChatMessages,
    RoomGroup,
  },

  mounted() {
    this.startConversation();
  },

  data: () => ({
    sentMessages: [],
    nilo: { uuid: 'nilo', name: 'Nilo', photo_url: '/onboarding/nilo.png' },
  }),

  computed: {
    room() {
      return {
        uuid: 'room-uuid',
        contact: this.nilo,
        queue: {},
        tags: [],
        user: this.me,
        is_active: true,
      };
    },
    me() {
      return this.$store.state.profile.me;
    },
    messagesWithSentTimeout() {
      const messages = [
        ['Olá, acho que nos conhecemos, mas caso você não lembre sou o Nilo 😁', 0],
        [
          'Agente, esse é o novo módulo de atendimento humano da Weni, e é por aqui que você poderá fazer o atendimento dos seus clientes',
        ],
        ['Esperamos que goste! '],
        ['Caso você queira dicas de uso do Chats, é só me pedir, viu?'],
        [
          'Se quiser encerrar a conversa tudo bem, não ficarei chateado, é só clicar naquele X ali no em cima à direita',
        ],
        ['E quando precisar falar comigo basta digitar /nilo'],
      ];

      return messages;
    },
    messages() {
      const messagesWithSender = this.sentMessages.map(parseMessageToMessageWithSenderProp);
      const groupedMessages = groupSequentialSentMessages(messagesWithSender);
      return groupedMessages;
    },
  },

  methods: {
    message(text) {
      return {
        text,
        created_on: new Date().toISOString(),
        content: [],
        media: [],
        contact: this.nilo,
        user: null,
      };
    },
    async startConversation() {
      const messages = this.messagesWithSentTimeout;

      // eslint-disable-next-line no-restricted-syntax
      for await (const [text, timeout] of messages) {
        const randomTimeoutInSeconds = Math.random() * (2 - 1) + 1;
        await new Promise((resolve) => {
          setTimeout(() => {
            const message = this.message(text);
            this.sentMessages.push(message);
            resolve();
          }, timeout || randomTimeoutInSeconds * 1000);
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.room-list {
  display: flex;
  min-height: 0;
  padding-bottom: $unnnic-spacing-inset-nano;

  &__rooms {
    flex: 1 1;

    padding-right: $unnnic-spacing-inset-sm;
    border-right: solid 1px $unnnic-color-neutral-soft;
    overflow-y: auto;
  }
}

.room {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: {
    top: $unnnic-spacing-inset-md;
    bottom: $unnnic-spacing-inset-sm;
    left: $unnnic-spacing-inset-md;
  }

  .messages {
    overflow-y: auto;
    padding-right: $unnnic-spacing-inset-sm;
    margin: $unnnic-spacing-inline-sm 0 $unnnic-spacing-inline-sm;
  }

  .message-editor {
    margin-right: $unnnic-spacing-inline-sm;
    margin-top: auto;
  }
}
</style>
