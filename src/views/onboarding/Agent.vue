<template>
  <ChatsLayout>
    <template #room-list>
      <section class="room-list">
        <div class="room-list__rooms">
          <UnnnicToolTip
            v-if="!roomOpen"
            enabled
            text="Um contato está esperando por você!"
            side="right"
            forceOpen
          >
            <CardGroup
              :label="$t('line')"
              :rooms="[room]"
              usePhoto
              @open="(roomOpen = true), startConversation()"
            />
          </UnnnicToolTip>
          <CardGroup
            v-else
            :label="$t('chats.in_progress')"
            :rooms="[room]"
            usePhoto
          />
        </div>
      </section>
    </template>

    <section
      v-if="roomOpen"
      class="room"
    >
      <ChatHeader
        :room="room"
        :closeButtonTooltip="$t('chats.end')"
        usePhoto
        @close="close"
      />
      <ChatMessages
        ref="chatMessages"
        :room="room"
        :messages="messages"
        class="messages"
        usePhoto
      />

      <div class="message-manager">
        <MessageManager />
      </div>
    </section>
    <section
      v-else
      class="illustration"
    >
      <img
        class="illustration__doodles"
        src="/homepage-illustration/doodles.svg"
        alt=""
      />
      <img
        class="illustration__background"
        src="/homepage-illustration/background.svg"
        alt=""
      />
    </section>
  </ChatsLayout>
</template>

<script>
import ChatHeader from '@/components/chats/chat/ChatHeader.vue';
import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';
import MessageManager from '@/components/chats/MessageManager/index.vue';
import CardGroup from '@/layouts/ChatsLayout/components/TheCardGroups/CardGroup/index.vue';

import ChatsLayout from '@/layouts/ChatsLayout/index.vue';

import Profile from '@/services/api/resources/profile';

import { mapState } from 'pinia';
import { useProfile } from '@/store/modules/profile';

// import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';

export default {
  name: 'AgentOnboarding',

  components: {
    ChatsLayout,
    ChatHeader,
    ChatMessages,
    MessageManager,
    CardGroup,
  },

  data: () => ({
    roomOpen: false,
    sentMessages: [],
    nilo: { uuid: 'nilo', name: 'Nilo', photo_url: '/onboarding/nilo.png' },
  }),

  computed: {
    ...mapState(useProfile, ['me']),
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
    messagesWithSentTimeout() {
      const messages = [
        [
          'Olá, acho que nos conhecemos, mas caso você não lembre sou o Nilo 😁',
          0,
        ],
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
      // const messagesWithSender = this.sentMessages.map(parseMessageToMessageWithSenderProp);
      const groupedMessages = []; // groupSequentialSentMessages(messagesWithSender)
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
          setTimeout(
            () => {
              const message = this.message(text);
              this.sentMessages.push(message);
              resolve();
            },
            timeout || randomTimeoutInSeconds * 1000,
          );
        });
      }
    },
    async close() {
      sessionStorage.setItem('CHATS_USER_ONBOARDED', true);
      await Profile.onboard();
      this.$router.push({ name: 'home' });
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

  .message-manager {
    margin-right: $unnnic-spacing-inline-sm;
    margin-top: auto;
  }
}

.illustration {
  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
  height: 100%;
  margin-left: $unnnic-spacing-inline-sm;

  &__doodles,
  &__background {
    position: absolute;
    height: 100%;
    width: 100%;
    object-fit: cover;
    object-position: center;
    pointer-events: none;
  }

  &__doodles {
    padding-left: $unnnic-spacing-inset-xs;
  }
}
</style>
