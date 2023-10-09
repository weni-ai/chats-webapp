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
        <unnnic-table v-if="this.rooms.length > 0" :items="rooms" class="closed-chats__list__table">
          <template #header>
            <unnnic-table-row :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <unnnic-table-row :headers="tableHeaders">
              <template #contactName>
                <div class="closed-chats__list__table__contact">
                  <unnnic-chats-user-avatar :username="item.contact.name" />
                  <p class="closed-chats__list__table__contact__name">
                    {{ item.contact.name }}
                  </p>
                </div>
              </template>

              <template #agentName>{{ item.user?.first_name }}</template>

              <template #tags>
                <tag-group :tags="item.tags || []" :flex="false" />
              </template>

              <template #date>{{ $d(new Date(item.ended_at)) }}</template>

              <template #visualize>
                <unnnic-button
                  class="closed-chats__list__table__visualize"
                  :text="$t('see')"
                  type="secondary"
                  size="large"
                />
              </template>
            </unnnic-table-row>
          </template>
        </unnnic-table>
        <p class="closed-chats__list__table__no-results" v-else>{{ $t('without_results') }}</p>

        <section class="closed-chats__list__pages">
          <p class="closed-chats__list__pages__count">
            {{ tablePagination }}
          </p>

          <unnnic-pagination v-model="roomsCurrentPage" :max="roomsCountPages" :show="roomsLimit" />
        </section>
      </section>
    </main>
  </div>
</template>

<script>
import moment from 'moment';

import ProjectApi from '@/services/api/resources/settings/project';
import Sector from '@/services/api/resources/settings/sector';
import History from '@/services/api/resources/chats/history';
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

    crumbs: [
      {
        name: 'Chats',
        path: 'home',
      },
    ],
    project: null,
    rooms: [],
    roomsCount: 0,
    roomsCountPages: 0,
    roomsCurrentPage: 1,
    roomsLimit: 5,

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
    this.getHistoryRooms();

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

    tablePagination() {
      const { roomsCurrentPage, roomsLimit, roomsCount } = this;

      return this.$t('pagination', {
        from: (roomsCurrentPage - 1) * roomsLimit + 1,
        to: Math.min(roomsCurrentPage * roomsLimit, roomsCount),
        total: roomsCount,
      });
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

    async getHistoryRooms() {
      const { roomsCurrentPage, roomsLimit } = this;

      const offset = (roomsCurrentPage - 1) * roomsLimit;

      try {
        const response = await History.getHistoryRooms({ offset, limit: roomsLimit });
        this.rooms = response.results;
        this.roomsCount = response.count;
        this.roomsCountPages = Math.ceil(response.count / roomsLimit);
      } catch (error) {
        console.log(error);
      }
    },
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
          const responseRoom = await History.getUnicContactClosedRooms(roomId);
          const responseRoomMessages = await Message.getByContact(roomId, 20, 20);
          console.log(responseRoomMessages);
          this.selectedRoom = responseRoom;
          // this.selectedRoomMessages = responseRoomMessages;

          this.isLoadingSelectedRoom = false;
        }
      },
    },
    roomsCurrentPage() {
      this.getHistoryRooms();
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

  main {
    height: 100%;
    overflow: hidden;
  }

  &__list {
    padding: $unnnic-spacing-md;
    padding-top: $unnnic-spacing-sm;

    display: grid;
    gap: $unnnic-spacing-sm;

    grid-template-rows: auto 1fr auto;
    height: 100%;

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
      overflow: hidden;

      &__no-results {
        color: $unnnic-color-neutral-cloudy;
        font-size: $unnnic-font-size-body-gt;
      }

      &__contact {
        display: flex;
        align-items: center;
        gap: $unnnic-spacing-nano;

        &__name {
          overflow: hidden;

          width: 100%;

          font-size: $unnnic-font-size-body-lg;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &__visualize {
        width: 100%;
      }
    }

    &__pages {
      display: flex;
      align-items: center;
      justify-content: space-between;

      height: min-content;

      margin-top: $unnnic-spacing-md;
      border-top: $unnnic-border-width-thinner solid $unnnic-color-neutral-soft;
      padding-top: $unnnic-spacing-md;

      &__count {
        color: $unnnic-color-neutral-dark;
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
