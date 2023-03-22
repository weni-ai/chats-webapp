<template>
  <chats-layout disabled-chat-list>
    <section class="closed-chats__container">
      <section v-if="!!contact" class="closed-chat">
        <chat-header
          :room="{ ...contact.room, contact }"
          @close="close"
          :closeButtonTooltip="$t('close_view')"
          @show-contact-info="componentInAsideSlot = 'contactInfo'"
        />
        <chat-messages
          :room="{ ...contact.room, contact }"
          :messages="messages"
          class="messages"
          ref="chatMessages"
          @scrollTop="searchForMoreMessages"
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

        <section class="filters unnnic-grid-giant" style="padding: 0">
          <div class="unnnic-grid-span-2">
            <unnnic-input
              label="Buscar contato"
              v-model="nameOfContact"
              @input="getContacts(nameOfContact)"
              icon-left="search-1"
              size="md"
              placeholder="Pesquisar contato"
            ></unnnic-input>
          </div>
          <div class="unnnic-grid-span-2" v-if="sectors.length !== 1">
            <unnnic-select
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
          </div>
          <div class="unnnic-grid-span-2">
            <div style="padding-top: 38px"></div>
            <unnnic-autocomplete-select
              v-model="selecteds"
              :items="tags"
              :placeholder="this.messageInputTags"
              :disabled="!this.filteredSectorUuid && sectors.length !== 1"
            />
          </div>
          <div class="unnnic-grid-span-2">
            <div style="padding-top: 38px"></div>
            <unnnic-input-date-picker
              v-model="filteredDateRange"
              size="md"
              class="input"
              :input-format="$t('date_format')"
              position="right"
            />
          </div>
          <div class="clear-filters-button unnnic-grid-span-1">
            <div style="padding-top: 38px"></div>
            <unnnic-tool-tip enabled :text="$t('filter.clear_all')" side="right">
              <unnnic-button-icon
                icon="button-refresh-arrows-1"
                size="large"
                @click="clearFilters"
              />
            </unnnic-tool-tip>
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
                  size="large"
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
        <div style="display: flex; align-items: center; justify-content: space-between">
          <div class="count-values">
            {{ this.showing }} - {{ this.totalShowing }} de {{ count }}
          </div>
          <unnnic-pagination v-model="currentPage" :max="numberOfPages" :show="5" />
        </div>
      </section>
    </section>
    <template #aside>
      <component
        :is="sidebarComponent.name"
        v-on="sidebarComponent.listeners"
        :contact="contact"
        :isHistory="true"
      />
    </template>
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
import ContactInfo from '@/components/chats/ContactInfo';

const moment = require('moment');

export default {
  name: 'ClosedChatsView',

  components: {
    ChatHeader,
    ChatMessages,
    ChatsLayout,
    TagGroup,
    UserAvatar,
    ContactInfo,
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
    componentInAsideSlot: '',
    messages: [],
    messageInputTags: 'Filtrar por tags',
    isLoading: false,
    filteredDateRange: {
      // start: moment(new Date()).startOf('month').format('YYYY-MM-DD'),
      // end: moment(new Date()).endOf('month').format('YYYY-MM-DD'),
    },
    sectorTags: [],
    selecteds: [],
    contacts: [],
    sectors: [],
    filteredSectorUuid: '',
    tags: [],
    page: 0,
    pageHistory: 0,
    numberOfPages: 0,
    count: 1,
    limit: 50,
    hasNext: false,
    currentPage: 1,
    total: [],
    totalShowing: 0,
    showing: 0,
    nameOfContact: '',
  }),

  computed: {
    sidebarComponent() {
      return this.sidebarComponents[this.componentInAsideSlot] || {};
    },
    sidebarComponents() {
      return {
        contactInfo: {
          name: ContactInfo.name,
          listeners: {
            close: () => {
              this.componentInAsideSlot = '';
            },
          },
        },
      };
    },
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
      if (this.selecteds.length === 0) return [];
      const group = this.selecteds;
      return group;
    },
  },

  methods: {
    async openContactHistory(contact, concat) {
      const offset = this.page * this.limit;
      try {
        this.isLoading = true;
        const response = await Message.getByContact(contact.uuid, offset, this.limit);
        let messages = response.results;
        this.hasNext = response.next;
        this.scrollMessagesToBottom();
        if (concat) {
          messages = response.results.concat(this.messages);
        }
        const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
        const groupedMessages = groupSequentialSentMessages(messagesWithSender);
        this.messages = groupedMessages;
        this.contact = contact;
        this.isLoading = false;
      } finally {
        this.isLoading = false;
      }
    },

    searchForMoreMessages() {
      if (this.isLoading) return;
      if (this.hasNext) {
        this.page += 1;
        this.openContactHistory(this.contact, true);
      }
    },

    close() {
      this.contact = null;
      this.page = 0;
      this.limit = 50;
    },

    scrollMessagesToBottom() {
      if (!this.$refs.chatMessages) return;
      this.$refs.chatMessages.$el.scrollTop = 15;
    },

    async getContacts() {
      this.isLoading = true;
      this.offset = (this.currentPage - 1) * 6;
      this.limit = 6;
      try {
        const response = await Contact.getAllWithClosedRooms(
          this.offset,
          this.limit,
          this.nameOfContact,
        );
        this.numberOfPages = Math.ceil(response.count / 6);
        this.count = response.count;
        this.contacts = response.results;
        if (!response.next) {
          this.countTotal(this.offset, this.count);
        } else {
          this.countTotal(this.offset, this.contacts.length);
        }
      } finally {
        this.isLoading = false;
      }
    },

    countTotal(offset, limit) {
      if (limit > this.count) {
        this.totalShowing = 6;
      } else {
        this.totalShowing = limit;
      }
      if (offset === 0) {
        this.showing = 1;
      } else {
        this.showing = offset;
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

        const tagGroup = tags.map((tag) => ({ ...tag, value: tag.uuid, text: tag.name }));
        this.tags = tagGroup;
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
        if (this.sectors.length === 1) {
          this.getSectorTags(this.sectors[0].uuid);
        }
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },
    contactHasAllActiveFilterTags(contact) {
      if (this.filteredTags.length === 0) return true;
      if (!contact.room.tags) return false;
      // const placeholderTags = this.filteredTags.map((el) => el.name);
      // this.messageInputTags = placeholderTags ? placeholderTags.toString() : 'Filtrar por tags';
      return contact.room.tags.some((tag) => this.filteredTags.find((el) => el.uuid === tag.uuid));
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
  watch: {
    messages() {
      this.$nextTick(this.scrollMessagesToBottom);
    },
    currentPage() {
      this.getContacts();
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
    scroll-behavior: smooth;
    padding-right: $unnnic-spacing-inset-sm;
    margin: $unnnic-spacing-inline-sm 0 $unnnic-spacing-inline-sm;
  }
}

.count-values {
  color: $unnnic-color-neutral-dark;
  size: $unnnic-font-size-body-md;
  font-weight: 400;
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
    // display: flex;
    // align-items: flex-end;
    // gap: $unnnic-spacing-stack-sm;
    // width: 100%;

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
