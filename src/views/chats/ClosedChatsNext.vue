<template>
  <closed-chats-header-loading v-if="isLoadingHeader" />
  <div class="closed-chats" v-else>
    <header v-if="project">
      <unnnic-chats-header
        :title="project.name"
        :subtitle="$t('chats.closed_chats.project_history')"
        avatarIcon="task-list-clock-1"
        :crumbs="crumbs"
        :close="backToHome"
      />
      <unnnic-chats-header
        v-if="selectedRoom"
        :title="selectedRoom.name"
        :avatarName="selectedRoom.name"
        :close="() => {}"
      />
    </header>
    <main>
      <section v-if="roomId && selectedRoom" class="closed-chats__selected-chat">
        <div>chatMessages</div>
        <contact-info is-history :contact="selectedRoom" @close="() => {}" />
      </section>

      <section v-else class="closed-chats__list">
        <section class="closed-chats__list__handlers">
          <div class="closed-chats__list__handlers__input">
            <unnnic-label :label="$t('chats.search_contact')" />
            <unnnic-input
              v-model="filterContact"
              icon-left="search-1"
              :placeholder="$t('name_or_phone')"
            />
          </div>
          <div class="closed-chats__list__handlers__input">
            <unnnic-label :label="$t('sector.title')" />
            <unnnic-select-smart
              v-model="filterSector"
              :options="sectorsToFilter"
              ordered-by-index
            />
          </div>
          <div class="closed-chats__list__handlers__input">
            <unnnic-label :label="$t('tags.title')" />
            <unnnic-select-smart
              v-model="filterTag"
              :disabled="filterSector[0]?.value === 'all' || tagsToFilter.length < 2"
              :options="tagsToFilter"
              multiple
            />
          </div>
          <div class="closed-chats__list__handlers__input">
            <unnnic-label :label="$t('filter.by_date')" />
            <unnnic-input-date-picker
              v-model="filterDate"
              position="right"
              :inputFormat="$t('date_format')"
              class="closed-chats__list__handlers__date-picker"
            />
          </div>
          <unnnic-button type="secondary" :text="$t('clear')" />
        </section>
        <unnnic-table
          v-if="this.rooms.length > 0"
          :items="this.contacts"
          class="closed-chats__list__table"
        >
          <!-- <template #header>
            <unnnic-table-row :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <unnnic-table-row :headers="tableHeaders">
              <template #contactName>
                <div class="contact-name">
                  <user-avatar :username="item.name" size="xl" style="min-width: 2.5rem" />
                  {{ item.name }}
                </div>
              </template>

              <template #agentName>{{ item.room.user?.first_name }}</template>

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
          </template> -->
        </unnnic-table>
        <p class="closed-chats__list__table__no-results" v-else>{{ $t('without_results') }}</p>
      </section>
    </main>
  </div>
</template>

<script>
import moment from 'moment';

import ProjectApi from '@/services/api/resources/settings/project';
import Sector from '@/services/api/resources/settings/sector';
import Contact from '@/services/api/resources/chats/contact';
import Message from '@/services/api/resources/chats/message';

import ContactInfo from '@/components/chats/ContactInfo';
import ClosedChatsHeaderLoading from '@/views/loadings/ClosedChats/ClosedChatsHeader.vue';

export default {
  name: 'ClosedChatsNext',

  components: {
    ClosedChatsHeaderLoading,
    ContactInfo,
  },

  props: {
    roomId: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    isLoadingHeader: true,
    rooms: [],
    project: null,
    crumbs: [
      {
        name: 'Chats',
        path: 'home',
      },
    ],
    selectedRoom: null,
    sectorsToFilter: [],
    tagsToFilter: [],
    filterContact: [],
    filterSector: [],
    filterTag: [],
    filterDate: {
      start: moment().subtract(1, 'week').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
    },
  }),

  created() {
    this.getSectors();
    this.filterSector = [this.filterSectorsOptionAll];

    this.projectInfo();
    this.crumbs.push({
      name: this.$t('chats.closed_chats.history'),
      path: 'closed-rooms',
    });
  },

  computed: {
    filterSectorsOptionAll() {
      return { value: 'all', label: this.$t('all') };
    },
  },

  methods: {
    backToHome() {
      this.$router.push({ name: 'home' });
    },

    async projectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
      this.isLoadingHeader = false;
    },

    async getSectors() {
      try {
        const response = await Sector.list();
        const { results } = response;

        const newSectors = [this.filterSectorsOptionAll];
        results.forEach(({ uuid, name }) => newSectors.push({ value: uuid, label: name }));
        this.sectorsToFilter = newSectors;

        if (results.length > 0) {
          this.getSectorTags(results[0].uuid);
        }
      } catch (error) {
        console.error('The sectors could not be loaded at this time.', error);
      }
    },

    async getSectorTags(sectorUuid) {
      if (!sectorUuid) {
        this.tagsToFilter = [];
        return;
      }
      try {
        const response = await Sector.tags(sectorUuid);
        const { results } = response;

        const newTags = [{ value: '', label: this.$t('filter.by_tags') }];
        results.forEach(({ uuid, name }) => newTags.push({ value: uuid, label: name }));
        this.tagsToFilter = newTags;
      } catch (error) {
        console.error('The sector tags could not be loaded at this time.', error);
      }
    },

    // async getClosedChat(contact, concat) {
    //   const offset = this.page * 20;
    //   try {
    //     this.isLoading = true;
    //     const response = await Message.getByContact(contact.uuid, offset, 20);
    //     let messages = response.results;
    //     this.hasNext = response.next;
    //     this.scrollMessagesToBottom();
    //     if (concat) {
    //       messages = response.results.concat(this.messages);
    //     }
    //     const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
    //     const groupedMessages = groupSequentialSentMessages(messagesWithSender);
    //     this.messages = groupedMessages;
    //     this.contact = contact;
    //     this.isLoading = false;
    //     this.componentInAsideSlot = 'contactInfo';
    //   } finally {
    //     this.isLoading = false;
    //   }
    // },
  },

  watch: {
    roomId: {
      immediate: true,
      async handler(roomId) {
        if (roomId) {
          this.crumbs.push({
            name: 'Nome do usuário',
            path: 'closed-rooms/:roomId',
          });
          const responseRoom = await Contact.getUnicContactClosedRooms(roomId);
          const responseRoomMessages = await Message.getByContact(roomId, 20, 20);
          console.log(responseRoomMessages);
          this.selectedRoom = responseRoom;
          // this.selectedRoomMessages = responseRoomMessages;
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.closed-chats {
  display: flex;
  flex-direction: column;

  height: 100vh;
  width: 100vw;

  overflow: hidden;

  &__list {
    padding: $unnnic-spacing-md;
    padding-top: $unnnic-spacing-sm;

    display: grid;
    gap: $unnnic-spacing-sm;

    &__handlers {
      display: grid;
      grid-template-columns: repeat(4, 1fr) auto;

      gap: $unnnic-spacing-sm;
      justify-content: space-between;
      align-items: flex-end;

      &__input {
        width: 100%;
      }

      &__date-picker {
        display: grid;
      }
    }

    &__table {
      &__no-results {
        color: $unnnic-color-neutral-cloudy;
        font-size: $unnnic-font-size-body-gt;
      }
    }
  }

  &__selected-chat {
    display: grid;
    grid-template-columns: 9fr 3fr;

    :deep(.unnnic-chats-header) {
      display: none;
    }
  }
}
</style>
