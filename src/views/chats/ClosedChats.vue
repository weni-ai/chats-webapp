<template>
  <chats-layout disabled-chat-list>
    <section class="closed-chats__container">
      <section v-if="!!chat" class="closed-chat">
        <chat-header
          :chat="{ ...chat }"
          @close="chat = null"
          closeButtonTooltip="Fechar visualização"
        />
        <chat-messages :chat="{ ...chat }" class="messages" />
      </section>

      <section class="closed-chats" v-else>
        <header class="header">
          <div class="title">
            <unnnic-card
              type="title"
              title="Histórico"
              icon="task-list-clock-1"
              scheme="aux-purple"
              :has-information-icon="false"
            />
          </div>
        </header>

        <section class="filters">
          <tag-filter v-model="filteredTags" label="Classificar chats por tags e período" />

          <unnnic-input-date-picker
            v-model="filteredDateRange"
            size="sm"
            input-format="DD/MM/YYYY"
          />

          <unnnic-tool-tip enabled text="Limpar filtros" side="right">
            <unnnic-button-icon icon="button-refresh-arrows-1" size="small" @click="clearFilters" />
          </unnnic-tool-tip>
        </section>

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
                <tag-group :tags="item.tags" />
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
    </section>
  </chats-layout>
</template>

<script>
import { mapState } from 'vuex';

import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import ChatsLayout from '@/layouts/ChatsLayout';
import TagFilter from '@/components/chats/TagFilter';
import TagGroup from '@/components/TagGroup';
import UserAvatar from '@/components/chats/UserAvatar';

export default {
  name: 'ClosedChatsView',

  components: {
    ChatHeader,
    ChatMessages,
    ChatsLayout,
    TagFilter,
    TagGroup,
    UserAvatar,
  },

  props: {
    tag: {
      type: String,
      default: '',
    },
  },

  beforeMount() {
    if (this.tag) this.filteredTags.push(this.tag);
  },

  data: () => ({
    chat: null,
    filteredDateRange: {
      start: '',
      end: '',
    },
    filteredTags: [],
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
      tags: (state) => state.chats.tags,
    }),

    filteredClosedChats() {
      return this.closedChats
        .filter(this.chatHasAllActiveFilterTags)
        .filter(this.isChatDateInFilteredRange);
    },
  },

  methods: {
    chatHasAllActiveFilterTags(chat) {
      if (this.filteredTags.length === 0) return true;

      // eslint-disable-next-line no-restricted-syntax
      for (const tag of this.filteredTags) {
        if (!chat.tags.find((t) => t.value === tag)) {
          return false;
        }
      }

      return true;
    },

    stringToDate(date) {
      const [day, month, year] = date.split('/');

      return new Date(year, Number(month) - 1, day);
    },

    isChatDateInFilteredRange(chat) {
      const { start, end } = this.filteredDateRange;
      if (!start && !end) return true;

      const chatDate = this.stringToDate(chat.date).toISOString();

      return start <= chatDate && chatDate <= end;
    },

    clearFilters() {
      this.filteredTags = [];
      this.filteredDateRange = { start: '', end: '' };
    },
  },
};
</script>

<style lang="scss" scoped>
.closed-chats__container {
  height: 100%;
  padding: {
    top: $unnnic-spacing-inset-md;
    right: 0;
    bottom: $unnnic-spacing-inset-sm;
    left: $unnnic-spacing-inset-md;
  }
}

.closed-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: $unnnic-spacing-inset-md;

  .messages {
    overflow-y: auto;
    padding-right: $unnnic-spacing-inset-md;
    margin: $unnnic-spacing-inline-sm 0;
  }
}

.closed-chats {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  padding-right: $unnnic-spacing-inset-md;

  .header {
    padding-bottom: $unnnic-spacing-inset-md;
    margin-bottom: $unnnic-spacing-inline-md;
    border-bottom: solid 1px $unnnic-color-neutral-soft;

    .title {
      width: min-content;
    }
  }

  .filters {
    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-stack-sm;

    .date-range-select {
      flex-basis: 33.33%;
    }
  }

  .closed-chats-table {
    max-height: 100%;
    overflow-y: auto;
    margin-top: $unnnic-spacing-inline-lg;

    .tags {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: $unnnic-spacing-stack-md;
    }
  }

  .visualize-button {
    width: 100%;
  }

  .contact-name {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-xs;
  }
}
</style>
