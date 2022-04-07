<template>
  <main-layout>
    <section v-if="!!chat" class="active-chat">
      <chat-header :chat="{ ...chat }" @close="chat = null" />
      <chat-messages :chat="{ ...chat }" class="messages" />
    </section>

    <section class="closed-chats" v-else>
      <h1>Histórico de conversas</h1>

      <tag-filter v-model="tags" label="Classificar conversas por tags" />

      <unnnic-table :items="filteredClosedChats" class="closed-chats-table">
        <template #header>
          <unnnic-table-row :headers="tableHeaders" />
        </template>

        <template #item="{ item }">
          <unnnic-table-row :headers="tableHeaders">
            <template #contactName>
              <div class="contact-name">
                <user-avatar :username="item.username" size="xl" />
                {{ item.username }}
              </div>
            </template>

            <template #agentName>{{ item.agent }}</template>

            <template #tags>
              <div class="tags">
                <unnnic-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  :text="TAGS[tag].text"
                  :disabled="!tags.includes(tag)"
                  :scheme="TAGS[tag].scheme"
                />
              </div>
            </template>

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
import TagFilter from '@/components/TagFilter';
import UserAvatar from '@/components/UserAvatar';

const TAGS = {
  doubts: { text: 'Dúvidas', scheme: 'feedback-yellow' },
  finance: { text: 'Financeiro', scheme: 'feedback-red' },
  help: { text: 'Ajuda', scheme: 'feedback-green' },
};

export default {
  name: 'ClosedChatsView',

  components: {
    ChatHeader,
    ChatMessages,
    MainLayout,
    TagFilter,
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

    TAGS,

    tableHeaders: [
      {
        id: 'contactName',
        text: 'Contato',
        flex: 3,
      },
      {
        id: 'agentName',
        text: 'Agente',
        flex: 2,
      },
      {
        id: 'tags',
        text: 'Tags',
        flex: 5,
      },
      {
        id: 'date',
        text: 'Data',
        flex: 2,
      },
      {
        id: 'visualize',
        text: 'Visualizar',
        flex: 3,
      },
    ],
  }),

  computed: {
    ...mapState({
      closedChats: (state) => state.chats.closedChats,
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
    margin-top: 2rem;

    .tags {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 1.5rem;
    }
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
