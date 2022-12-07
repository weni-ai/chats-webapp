<template>
  <chats-layout disabled-chat-list>
    <section class="closed-chats__container">
      <section v-if="!!contact" class="closed-chat">
        <chat-header
          :room="{ ...contact.room, contact }"
          @close="contact = null"
          :closeButtonTooltip="$t('close_view')"
        />
        <chat-messages :room="{ ...contact.room, contact }" :messages="messages" class="messages" />
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
          <div style="display: flex; align-items: flex-end; gap: 1rem; width: 100%">
            <unnnic-select
              v-if="sectors.length > 1"
              v-model="filteredSectorUuid"
              label="Setor"
              size="md"
              class="input"
              @input="getSectorTags(filteredSectorUuid)"
            >
              <option value="">Todos</option>
              <option
                v-for="sector in sectors"
                :key="sector.uuid"
                :value="sector.uuid"
                :selected="sector.uuid === filteredSectorUuid"
              >
                {{ sector.name }}
              </option>
            </unnnic-select>

            <!-- <unnnic-multi-select
              v-model="tags"
              class="input"
              label="Filtrar por tags"
              input-title="Pesquise e selecione tags"
              expand
              hide-group-title
              style="width: 35%"
            /> -->
            <unnnic-autocomplete-select
              :value="[]"
              :items="tags"
              placeholder="Pesquisar tags"
              :disabled="!this.filteredSectorUuid"
            />

            <unnnic-input-date-picker
              v-model="filteredDateRange"
              size="md"
              class="input"
              :input-format="$t('date_format')"
              position="right"
            />
            <div class="clear-filters-button">
              <unnnic-tool-tip enabled :text="$t('filter.clear_all')" side="right">
                <unnnic-button-icon
                  icon="button-refresh-arrows-1"
                  size="large"
                  @click="clearFilters"
                />
              </unnnic-tool-tip>
            </div>
          </div>
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

              <template #agentName>{{ item.room.user.first_name }}</template>

              <template #tags>
                <tag-group :tags="item.room.tags || []" />
              </template>

              <template #date>{{ $d(new Date(item.room.ended_at)) }}</template>

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
        <div v-if="isLoading" class="weni-redirecting">
          <img class="logo" src="@/assets/LogoWeniAnimada4.svg" alt="" />
        </div>
      </section>
    </section>
  </chats-layout>
</template>

<script>
import Contact from '@/services/api/resources/chats/contact';
import Message from '@/services/api/resources/chats/message';
import Sector from '@/services/api/resources/settings/sector';
import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';

import ChatHeader from '@/components/chats/chat/ChatHeader';
import ChatMessages from '@/components/chats/chat/ChatMessages';
import ChatsLayout from '@/layouts/ChatsLayout';
import TagGroup from '@/components/TagGroup';
import UserAvatar from '@/components/chats/UserAvatar';

const moment = require('moment');

export default {
  name: 'ClosedChatsView',

  components: {
    ChatHeader,
    ChatMessages,
    ChatsLayout,
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
    this.getSectors();
  },

  data: () => ({
    contact: null,
    messages: [],
    isLoading: false,
    filteredDateRange: {
      start: moment(new Date()).startOf('month').format('YYYY-MM-DD'),
      end: moment(new Date()).endOf('month').format('YYYY-MM-DD'),
    },
    sectorTags: [],
    contacts: [],
    sectors: [],
    filteredSectorUuid: '',
    tags: [],
  }),

  computed: {
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
          text: this.$t('tags.title'),
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
        .filter(this.isRoomFromFilteredSector)
        .filter(this.contactHasAllActiveFilterTags)
        .filter(this.isRoomEndDateInFilteredRange);
    },

    filteredTags() {
      if (this.tags.length === 0) return [];

      const group = this.tags[0];
      if (!group?.selected && group?.selected !== 0) return [];

      const tag = group.items[group.selected];
      return [tag];
    },
  },

  methods: {
    async openContactHistory(contact) {
      try {
        this.isLoading = true;
        const response = await Message.getByContact(contact.uuid);
        const messages = response.results;
        const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
        const groupedMessages = groupSequentialSentMessages(messagesWithSender);
        this.messages = groupedMessages;
        this.contact = contact;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },
    async getContacts() {
      try {
        this.isLoading = true;
        const response = await Contact.getAllWithClosedRooms();
        this.contacts = response.results;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },
    async getSectorTags(sectorUuid) {
      if (!sectorUuid) {
        this.tags = [];
        return;
      }
      try {
        this.isLoading = true;
        const response = await Sector.tags(sectorUuid);
        const tags = response.results;

        const tagGroup = {
          items: tags.map((tag) => ({ ...tag, title: tag.name })),
        };

        this.tags = [tagGroup];
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },
    async getSectors() {
      try {
        this.isLoading = true;
        const response = await Sector.list();
        this.sectors = response.results;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },
    contactHasAllActiveFilterTags(contact) {
      if (this.filteredTags.length === 0) return true;
      if (!contact.room.tags) return false;

      // eslint-disable-next-line no-restricted-syntax
      for (const tag of this.filteredTags) {
        if (!contact.room.tags.some((t) => t.uuid === tag.uuid)) {
          return false;
        }
      }

      return true;
    },

    isRoomEndDateInFilteredRange(contact) {
      const { start, end } = this.filteredDateRange;
      if (!start && !end) return true;

      const roomDate = new Date(contact.room.ended_at).toISOString();

      return start <= roomDate && roomDate <= end;
    },

    isRoomFromFilteredSector(contact) {
      if (!this.filteredSectorUuid) return true;

      return contact.room.queue.sector === this.filteredSectorUuid;
    },

    clearFilters() {
      this.filteredSectorUuid = '';
      this.tags = [];
      this.filteredDateRange = {
        start: moment(new Date()).startOf('month').format('YYYY-MM-DD'),
        end: moment(new Date()).endOf('month').format('YYYY-MM-DD'),
      };
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
    width: 100%;

    & > .input {
      flex: 1 1;
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

  .weni-redirecting {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 1;
    height: auto;
  }
  .logo {
    width: 10%;
    max-width: 40px;
    max-height: 40px;
  }
}
</style>
