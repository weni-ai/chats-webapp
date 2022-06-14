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

        <section class="tags__container">
          <section class="tags">
            <p class="label">Tags de classificação do chat</p>
            <section>
              <tag-group :tags="chat.tags" />
            </section>
          </section>
        </section>
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

          <unnnic-select
            v-model="filteredDateRange"
            size="sm"
            label="Selecionar período"
            class="date-range-select"
          >
            <option value="">Desde o início</option>
            <option value="last-7-days">Últimos 7 dias</option>
            <option value="last-14-days">Últimos 14 dias</option>
            <option value="last-30-days">Últimos 30 dias</option>
            <option value="last-12-months">Últimos 12 meses</option>
            <option value="current-month">Mês Atual</option>
          </unnnic-select>

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
import TagGroup from '@/components/chats/TagGroup';
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
    filteredDateRange: '',
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
      if (!this.filteredDateRange) return true;

      const chatDate = this.stringToDate(chat.date);

      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth();
      const year = today.getFullYear();

      const dateRanges = {
        'last-7-days': () => new Date(year, month, day - 7) <= chatDate,
        'last-14-days': () => new Date(year, month, day - 14) <= chatDate,
        'last-30-days': () => new Date(year, month, day - 30) <= chatDate,
        'last-12-months': () => new Date(year, month - 12, day) <= chatDate,
        'current-month': () => month === chatDate.getMonth(),
      };

      return dateRanges[this.filteredDateRange]();
    },

    clearFilters() {
      this.filteredTags = [];
      this.filteredDateRange = '';
    },
  },
};
</script>

<style lang="scss" scoped>
.closed-chats__container {
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
    margin: $unnnic-spacing-inline-md 0 $unnnic-spacing-inline-sm;
  }

  .tags__container {
    border-top: solid 1px $unnnic-color-neutral-clean;
    margin: {
      bottom: -$unnnic-spacing-inline-sm;
      left: -$unnnic-spacing-inline-md;
      right: -$unnnic-spacing-inline-md;
    }

    .tags {
      padding: $unnnic-spacing-inset-md;

      .label {
        font-size: $unnnic-font-size-body-gt;
        font-weight: $unnnic-font-weight-bold;
        color: $unnnic-color-neutral-dark;
        margin-bottom: $unnnic-spacing-inline-sm;
      }
    }
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
