<template>
  <chats-layout disabled-chat-list>
    <section class="closed-chats__container">
      <section v-if="!!room" class="closed-chat">
        <chat-header
          :room="{ ...room }"
          @close="room = null"
          :closeButtonTooltip="$t('close_view')"
        />
        <chat-messages :room="{ ...room }" :messages="messages" class="messages" />
      </section>

      <section class="closed-chats" v-else>
        <header class="header">
          <div class="title">
            <unnnic-card
              type="title"
              :title="$t('history')"
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
            :input-format="$t('date_format')"
          />

          <unnnic-tool-tip enabled :text="$t('filter.clear_all')" side="right">
            <unnnic-button-icon icon="button-refresh-arrows-1" size="small" @click="clearFilters" />
          </unnnic-tool-tip>
        </section>

        <unnnic-table :items="filteredClosedRooms" class="closed-chats-table">
          <template #header>
            <unnnic-table-row :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <unnnic-table-row :headers="tableHeaders">
              <template #contactName>
                <div class="contact-name">
                  <user-avatar :username="item.contact.full_name" size="xl" />
                  {{ item.contact.full_name }}
                </div>
              </template>

              <template #agentName>{{ item.user.full_name }}</template>

              <template #tags>
                <tag-group :tags="item.tags" />
              </template>

              <template #date>{{ item.date }}</template>

              <template #visualize>
                <unnnic-button
                  :text="$t('chats.open_chat')"
                  type="secondary"
                  size="small"
                  class="visualize-button"
                  @click="viewClosedRoom(item)"
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

import Room from '@/services/api/resources/room';
import Message from '@/services/api/resources/message';
import { groupSequentialSentMessages } from '@/utils/messages';

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
    if (this.closedRooms.length === 0) {
      this.getClosedRooms();
    }
  },

  data: () => ({
    room: null,
    messages: [],
    filteredDateRange: {
      start: '',
      end: '',
    },
    filteredTags: [],
    closedRooms: [],
  }),

  computed: {
    ...mapState({
      tags: (state) => state.chats.tags,
    }),

    tableHeaders() {
      return [
        {
          id: 'contactName',
          text: this.$t('contact'),
          flex: 3,
        },
        {
          id: 'agentName',
          text: this.$t('agent'),
          flex: 2,
        },
        {
          id: 'tags',
          text: this.$t('tags'),
          flex: 5,
        },
        {
          id: 'date',
          text: this.$t('date'),
          flex: 2,
        },
        {
          id: 'visualize',
          text: this.$t('view'),
          flex: 3,
        },
      ];
    },

    filteredClosedRooms() {
      return this.closedRooms
        .filter(this.roomHasAllActiveFilterTags)
        .filter(this.isRoomDateInFilteredRange);
    },
  },

  methods: {
    async viewClosedRoom(room) {
      const response = await Message.getByRoomId(room.uuid);
      const messages = groupSequentialSentMessages(response.results);
      this.messages = messages;
      this.room = room;
    },
    async getClosedRooms() {
      const response = await Room.getClosed();
      this.closedRooms = response.results;
    },
    roomHasAllActiveFilterTags(chat) {
      if (this.filteredTags.length === 0) return true;

      // eslint-disable-next-line no-restricted-syntax
      for (const tag of this.filteredTags) {
        if (!chat.tags.find((t) => t.uuid === tag)) {
          return false;
        }
      }

      return true;
    },

    isRoomDateInFilteredRange(room) {
      const { start, end } = this.filteredDateRange;
      if (!start && !end) return true;

      const roomDate = new Date(room.ended_at).toISOString();

      return start <= roomDate && roomDate <= end;
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
