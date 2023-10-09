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
      <room-header-loading v-show="roomId && isLoadingSelectedRoom" />
      <unnnic-chats-header
        v-if="!isLoadingSelectedRoom && selectedRoom"
        :title="selectedRoom.name"
        :avatarName="selectedRoom.name"
        :close="() => {}"
      />
    </header>
    <main>
      <section v-if="roomId" class="closed-chats__selected-chat">
        <room-loading v-show="isLoadingSelectedRoom" only-messages />
        <div v-show="!isLoadingSelectedRoom && selectedRoom">chatMessages</div>
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
          v-if="this.mockedRooms.length > 0"
          :items="mockedRooms"
          class="closed-chats__list__table"
        >
          <template #header>
            <unnnic-table-row :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <unnnic-table-row :headers="tableHeaders">
              <template #contactName>
                <div class="contact-name">
                  <unnnic-chats-user-avatar :username="item.contact.name" />
                  {{ item.contact.name }}
                </div>
              </template>

              <template #agentName>{{ item.user?.first_name }}</template>

              <template #tags>
                <tag-group :tags="item.tags || []" :flex="false" />
              </template>

              <template #date>{{ $d(new Date(item.ended_at)) }}</template>

              <!-- <template #visualize>
                <unnnic-button
                  :text="$t('chats.open_chat')"
                  type="secondary"
                  size="large"
                  class="visualize-button"
                  @click="openContactHistory(item)"
                />
              </template> -->
            </unnnic-table-row>
          </template>
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
import RoomHeaderLoading from '@/views/loadings/RoomHeader.vue';
import RoomLoading from '@/views/loadings/Room.vue';

import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'ClosedChatsNext',

  components: {
    ClosedChatsHeaderLoading,
    RoomHeaderLoading,
    RoomLoading,
    ContactInfo,
    TagGroup,
  },

  props: {
    roomId: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    isLoadingHeader: true,
    isLoadingSelectedRoom: false,
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

    tableHeaders() {
      return [
        {
          id: 'contactName',
          text: this.$t('contact'),
          flex: 1,
        },
        {
          id: 'agentName',
          text: this.$t('agent'),
          flex: 1,
        },
        {
          id: 'tags',
          text: this.$t('tags.title'),
          flex: 1,
        },
        {
          id: 'date',
          text: this.$t('date'),
          flex: 1,
        },
        {
          id: 'visualize',
          text: this.$t('view'),
          flex: 1,
        },
      ];
    },

    mockedRooms() {
      return [
        {
          uuid: '1e2f586c-1152-4a3a-9bfc-fc69da4f538d',
          created_on: '2023-10-04T17:20:09.497802-03:00',
          ended_at: '2023-10-04T17:21:10.497802-03:00',
          user: {
            first_name: 'João',
            last_name: 'Atendente',
          },
          contact: {
            uuid: '864d8b62-2a6f-4147-b765-a9fedc059cd5',
            name: 'Maria das Graças',
          },
          tags: [
            {
              uuid: 'fcc06594-f407-490b-b08f-cb0abdb5314d',
              name: 'SAC',
            },
            {
              uuid: '65d95a04-f54e-42fd-a19a-b0b5f365896e',
              name: 'Resolvido',
            },
            {
              uuid: 'f5d95a04-f54e-42fd-a19a-b0b5f365896e',
              name: 'Tag2',
            },
            {
              uuid: 'e5d95a04-f54e-42fd-a19a-b0b5f365896e',
              name: 'Tag4',
            },
            {
              uuid: 'r5d95a04-f54e-42fd-a19a-b0b5f365896e',
              name: 'Tag3',
            },
            {
              uuid: 't5d95a04-f54e-42fd-a19a-b0b5f365896e',
              name: 'Tag6',
            },
          ],
        },
      ];
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
          this.isLoadingSelectedRoom = true;

          this.crumbs.push({
            name: 'Nome do usuário',
            path: 'closed-rooms/:roomId',
          });
          const responseRoom = await Contact.getUnicContactClosedRooms(roomId);
          const responseRoomMessages = await Message.getByContact(roomId, 20, 20);
          console.log(responseRoomMessages);
          this.selectedRoom = responseRoom;
          // this.selectedRoomMessages = responseRoomMessages;

          this.isLoadingSelectedRoom = false;
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
