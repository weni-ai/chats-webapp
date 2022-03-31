<template>
  <main-layout>
    <section v-if="!!chat" class="active-chat">
      <chat-header :chat="{ ...chat }" @close="chat = null" />
      <chat-messages :chat="{ ...chat }" class="messages" />
    </section>

    <section class="closed-chats" v-else>
      <h1>Histórico de conversas</h1>

      <tag-selector v-model="tags" label="Filtrar" />

      <unnnic-table :items="filteredClosedChats" class="closed-chats-table">
        <template #header>
          <unnnic-table-row :headers="tableHeaders" />
        </template>

        <template #item="{ item }">
          <unnnic-table-row :headers="tableHeaders">
            <template #contactName>
              <div class="contact-name">
                <user-avatar />
                {{ item.username }}
              </div>
            </template>

            <template #agentName>{{ item.agent }}</template>

            <template #date>{{ item.date }}</template>

            <template #visualize>
              <unnnic-button
                text="Abrir conversa"
                type="secondary"
                size="small"
                class="visualize-button"
                @click="chat = item"
              />
            </template>
          </unnnic-table-row>
        </template>
      </unnnic-table>
    </section>
  </main-layout>
</template>

<script>
import { mapState } from 'vuex';

import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';

import MainLayout from '@/layouts/MainLayout';
import TagSelector from '@/components/chats/TagSelector.vue';
import UserAvatar from '@/components/UserAvatar';

export default {
  name: 'ClosedChatsView',

  components: {
    ChatHeader,
    ChatMessages,
    MainLayout,
    TagSelector,
    UserAvatar,
  },

  props: {
    tag: {
      type: String,
      default: '',
    },
  },

  beforeMount() {
    if (this.tag) this.tags.push(this.tag);
  },

  data: () => ({
    chat: null,

    tags: [],

    tableHeaders: [
      {
        id: 'contactName',
        text: 'Contato',
        width: '25%',
      },
      {
        id: 'agentName',
        text: 'Agente',
        width: '25%',
      },
      {
        id: 'date',
        text: 'Data',
        width: '25%',
      },
      {
        id: 'visualize',
        text: 'Visualizar',
        width: '25%',
      },
    ],
  }),

  computed: {
    ...mapState({
      closedChats: (state) => state.data.closedChats,
    }),

    filteredClosedChats() {
      return this.closedChats.filter(this.chatHasAllActiveFilterTags);
    },
  },

  methods: {
    chatHasAllActiveFilterTags(chat) {
      // eslint-disable-next-line no-restricted-syntax
      for (const tag of this.tags) {
        if (chat.tags.indexOf(tag) === -1) {
          return false;
        }
      }

      return true;
    },
  },
};
</script>

<style lang="scss" scoped>
.active-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 1.5rem;

  .messages {
    overflow-y: auto;
    padding-right: 1.5rem;
    margin: 1.5rem 0 1rem;
  }
}

.closed-chats {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  padding-right: 1.5rem;

  h1 {
    font-size: 1.25rem;
    font-weight: $unnnic-font-weight-bold;
    line-height: 1.75rem;
    color: $unnnic-color-neutral-dark;
    margin-bottom: 1.5rem;
  }

  .closed-chats-table {
    max-height: 100%;
    overflow-y: auto;
    margin-top: 1rem;
  }

  .visualize-button {
    width: 100%;
  }

  .contact-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
