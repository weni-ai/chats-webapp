<template>
  <chats-layout disabled-chat-list>
    <section class="closed-chats__container">
      <section v-if="!!contact" class="closed-chat">
        <chat-header
          :room="{ contact }"
          @close="contact = null"
          :closeButtonTooltip="$t('close_view')"
        />
        <chat-messages
          :room="{ contact, tags: contact.tags || [] }"
          :messages="messages"
          class="messages"
        />
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
          <tag-filter
            v-model="filteredTags"
            :tags="sectorTags"
            label="Classificar chats por tags e período"
          />

          <unnnic-input-date-picker
            v-model="filteredDateRange"
            size="sm"
            :input-format="$t('date_format')"
          />

          <unnnic-tool-tip enabled :text="$t('filter.clear_all')" side="right">
            <unnnic-button-icon icon="button-refresh-arrows-1" size="small" @click="clearFilters" />
          </unnnic-tool-tip>
        </section>

        <unnnic-table :items="filteredContacts" class="closed-chats-table">
          <template #header>
            <unnnic-table-row :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <unnnic-table-row :headers="tableHeaders">
              <template #contactName>
                <div class="contact-name">
                  <user-avatar :username="item.name" size="xl" />
                  {{ item.name }}
                </div>
              </template>

              <template #agentName>{{ item.agent }}</template>

              <template #tags>
                <tag-group :tags="item.tags || []" />
              </template>

              <template #date>{{ $d(new Date(item.created_on)) }}</template>

              <template #visualize>
                <unnnic-button
                  :text="$t('chats.open_chat')"
                  type="secondary"
                  size="small"
                  class="visualize-button"
                  @click="openContactHistory(item)"
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

import Contact from '@/services/api/resources/chats/contact';
import Message from '@/services/api/resources/chats/message';
import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';

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

  async beforeMount() {
    if (this.tag) this.filteredTags.push(this.tag);
    await this.getContacts();
    this.getSectorTags();
  },

  data: () => ({
    contact: null,
    messages: [],
    filteredDateRange: {
      start: '',
      end: '',
    },
    sectorTags: [],
    filteredTags: [],
    contacts: [],
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

    filteredContacts() {
      return this.contacts
        .filter(this.contactHasAllActiveFilterTags)
        .filter(this.isContactCreateDateInFilteredRange);
    },
  },

  methods: {
    async openContactHistory(contact) {
      const response = await Message.getByContact(contact.uuid);
      const messages = response.results;
      const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
      const groupedMessages = groupSequentialSentMessages(messagesWithSender);
      this.messages = groupedMessages;
      this.contact = contact;
    },
    async getContacts() {
      const response = await Contact.getAllWithClosedRooms();
      this.contacts = response.results;
    },
    async getSectorTags() {
      // Tags need to be filtered by sector.
      // A new input filter will be implemented to do that.
      const contact = this.contacts.find((contact) => contact.tags.length > 0);
      if (!contact) return;

      this.sectorTags = [...contact.tags];
    },
    contactHasAllActiveFilterTags(contact) {
      if (this.filteredTags.length === 0) return true;
      if (!contact.tags) return false;

      // eslint-disable-next-line no-restricted-syntax
      for (const tag of this.filteredTags) {
        if (!contact.tags.find((t) => t.uuid === tag)) {
          return false;
        }
      }

      return true;
    },

    isContactCreateDateInFilteredRange(contact) {
      const { start, end } = this.filteredDateRange;
      if (!start && !end) return true;

      const roomDate = new Date(contact.created_on).toISOString();

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
