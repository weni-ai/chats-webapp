<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="container"
    data-testid="card-groups-container"
  >
    <UnnnicInput
      v-model="nameOfContact"
      iconLeft="search-1"
      :iconRight="nameOfContact ? 'close-1' : ''"
      :iconRightClickable="true"
      size="sm"
      :placeholder="$t('chats.search_contact_placeholder')"
      class="chat-groups__search-contact-input"
      data-testid="search-contact-input"
      @icon-right-click="nameOfContact = ''"
    />
    <section
      class="chat-groups__header"
      data-testid="chat-groups-header"
    >
      <UnnnicToolTip
        v-if="
          !isMobile &&
          !isUserAdmin &&
          project.config?.can_use_queue_prioritization
        "
        enabled
        :text="$t('chats.select_queues')"
        side="right"
        data-testid="queue-prioritization-tooltip"
      >
        <UnnnicButton
          iconCenter="filter_list"
          type="secondary"
          size="small"
          data-testid="queue-prioritization-button"
          @click="handleModalQueuePriorization"
        />
      </UnnnicToolTip>
    </section>
    <RoomsListLoading
      v-if="showLoadingRooms || !initialLoaded"
      data-testid="rooms-loading"
    />
    <section
      v-else
      class="chat-groups"
      @scroll="
        (event) => {
          handleScroll(event.srcElement);
        }
      "
    >
      <section class="chat-groups__tabs">
        <TabChip
          v-for="tab in roomsTabs"
          :key="tab.key"
          :label="tab.label"
          :count="
            tab.key === 'discussions' ? discussionsCount : roomsCount[tab.key]
          "
          :showDot="
            tab.key === 'ongoing'
              ? showOngoingDot
              : tab.key === 'discussions'
                ? showDiscussionsDot
                : false
          "
          :active="activeTab === tab.key"
          @click="activeTab = tab.key"
        />
      </section>
      <div
        v-if="showOrderBy"
        class="order-by"
        data-testid="order-by-section"
      >
        <div>
          <span data-testid="order-by-label">
            {{ $t('chats.room_list.order_by') }}
          </span>
        </div>
        <div
          class="apply-filter"
          data-testid="filter-controls"
        >
          <span
            :class="{ 'filter-active': orderBy[activeTab].includes('-') }"
            data-testid="most-recent-filter"
            @click="handleMostRecentFilter"
          >
            {{ $t('chats.room_list.most_recent') }}
          </span>

          <span> | </span>
          <span
            :class="{ 'filter-active': !orderBy[activeTab].includes('-') }"
            data-testid="older-filter"
            @click="handleOlderFilter"
          >
            {{ $t('chats.room_list.older') }}
          </span>
        </div>
      </div>
      <UnnnicDisclaimer
        v-if="enableAutomaticRoomRouting"
        :class="
          showOrderBy
            ? 'room-container__chats'
            : 'room-container__chats-margin-y'
        "
        :text="$t('chats.queue_priority_disclaimer')"
        iconColor="neutral-dark"
        data-testid="router-disclaimer"
      />
      <CardGroup
        v-show="activeTab === 'discussions'"
        :discussions="discussions"
        data-testid="discussions-card-group"
        @open="openDiscussion"
      />
      <CardGroup
        v-show="activeTab === 'waiting'"
        :rooms="rooms_queue"
        roomsType="waiting"
        data-testid="waiting-rooms-card-group"
        @open="openRoom"
      />
      <CardGroup
        v-show="activeTab === 'ongoing'"
        :rooms="rooms_ongoing"
        :withSelection="!isMobile && project.config?.can_use_bulk_transfer"
        roomsType="in_progress"
        data-testid="in-progress-rooms-card-group"
        @open="openRoom"
        @pin="handlePinRoom"
      />
      <CardGroup
        v-show="activeTab === 'flow_start'"
        :rooms="rooms_flow_start"
        data-testid="sent-flows-card-group"
        @open="openRoom"
      />
    </section>
    <ModalQueuePriorizations
      v-if="showModalQueue"
      data-testid="queue-prioritization-modal"
      @close="handleModalQueuePriorization"
    />
  </div>
</template>
<script>
import isMobile from 'is-mobile';
import { mapActions, mapState, mapWritableState } from 'pinia';
import unnnic from '@weni/unnnic-system';
import env from '@/utils/env';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';

import RoomsListLoading from '@/views/loadings/RoomsList.vue';
import CardGroup from './CardGroup/index.vue';
import TabChip from './TabChip.vue';
import ModalQueuePriorizations from '@/components/ModalQueuePriorizations.vue';
import Room from '@/services/api/resources/chats/room';

export default {
  name: 'TheCardGroups',
  components: {
    RoomsListLoading,
    CardGroup,
    ModalQueuePriorizations,
    TabChip,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    isViewMode: {
      type: Boolean,
      default: false,
    },
    viewedAgent: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      page: {
        ongoing: 0,
        waiting: 0,
        flow_start: 0,
        discussion: 0,
        search: 0,
      },
      limit: 100,
      nameOfContact: '',
      timerId: 0,
      showLoadingRooms: false,
      isLoadingRooms: false,
      isSearching: false,
      isMobile: isMobile(),
      showModalQueue: false,
      noQueueSelected: false,
      pinRoomLoading: {
        status: false,
        uuid: '',
      },
      initialLoaded: false,
    };
  },
  computed: {
    ...mapWritableState(useRooms, { allRooms: 'rooms' }),
    ...mapState(useRooms, {
      rooms_ongoing: 'agentRooms',
      rooms_queue: 'waitingQueue',
      rooms_flow_start: 'waitingContactAnswer',
      listRoomHasNext: 'hasNextRooms',
      newMessagesByRoom: 'newMessagesByRoom',
      maxPinLimit: 'maxPinLimit',
    }),
    ...mapState(useConfig, ['project', 'enableAutomaticRoomRouting']),
    ...mapState(useProfile, ['me']),
    ...mapState(useDiscussions, ['discussions']),
    ...mapWritableState(useRooms, [
      'orderBy',
      'roomsCount',
      'activeTab',
      'showOngoingDot',
    ]),
    ...mapWritableState(useDiscussions, [
      'discussionsCount',
      'showDiscussionsDot',
    ]),

    roomsTabs() {
      const tabs = [
        { key: 'ongoing', label: this.$t('chats.in_progress') },
        { key: 'waiting', label: this.$t('chats.waiting') },
      ];

      if (this.discussions.length) {
        tabs.push({ key: 'discussions', label: this.$t('chats.discussions') });
      }
      if (this.rooms_flow_start.length) {
        tabs.push({ key: 'flow_start', label: this.$t('chats.sent_flows') });
      }

      return tabs;
    },

    showOrderBy() {
      const { isHumanServiceProfile } = useProfile();
      const disableOrderByProjects =
        env('DISABLE_ORDER_BY_PROJECTS')?.split(',') || [];

      if (
        isHumanServiceProfile &&
        disableOrderByProjects.includes(this.project.uuid)
      ) {
        return false;
      }

      const countRooms = {
        ongoing: this.rooms_ongoing.length,
        waiting: this.rooms_queue.length,
        discussions: this.discussions.length,
        flow_start: this.rooms_flow_start.length,
      };

      return countRooms[this.activeTab] > 0;
    },

    isUserAdmin() {
      const ROLE_ADMIN = 1;
      return this.me.project_permission_role === ROLE_ADMIN;
    },
    totalUnreadMessages() {
      if (!this.newMessagesByRoom) {
        return 0;
      }
      return this.rooms_ongoing.reduce(
        (total, room) =>
          total + (this.newMessagesByRoom[room.uuid]?.messages?.length || 0),
        0,
      );
    },
    showNoResultsError() {
      return (
        !this.showLoadingRooms &&
        this.rooms_ongoing.length === 0 &&
        this.rooms_queue.length === 0 &&
        this.rooms_flow_start.length === 0 &&
        this.discussions.length === 0
      );
    },
    totalPinnedRooms() {
      return this.rooms_ongoing.filter((room) => room.is_pinned).length || 0;
    },
  },
  watch: {
    activeTab: {
      handler(newActiveTab) {
        if (newActiveTab === 'ongoing') {
          this.showOngoingDot = false;
        }
        if (newActiveTab === 'discussions') {
          this.showDiscussionsDot = false;
        }
      },
    },
    rooms_ongoing: {
      deep: true,
      handler(newRooms, oldRooms) {
        this.updateRoomsCount(newRooms.length, oldRooms.length, 'ongoing');
      },
    },
    rooms_queue: {
      deep: true,
      handler(newRooms, oldRooms) {
        this.updateRoomsCount(newRooms.length, oldRooms.length, 'waiting');
      },
    },
    rooms_flow_start: {
      deep: true,
      handler(newRooms, oldRooms) {
        this.updateRoomsCount(newRooms.length, oldRooms.length, 'flow_start');
      },
    },
    totalUnreadMessages: {
      immediate: true,
      handler() {
        window.parent.postMessage(
          {
            event: 'chats:update-unread-messages',
            unreadMessages: this.totalUnreadMessages,
          },
          '*',
        );
      },
    },
    nameOfContact: {
      handler(newNameOfContact) {
        const TIME_TO_WAIT_TYPING = 1300;
        if (this.timerId !== 0) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.page.search = 0;
          this.listRoom(false);
          this.listDiscussions();
          if (newNameOfContact) {
            this.isSearching = true;
          } else {
            this.isSearching = false;
          }
        }, TIME_TO_WAIT_TYPING);
      },
    },
  },
  async created() {
    this.allRooms = [];
    await Promise.all([
      this.listRoom(true, this.orderBy.waiting, 'waiting'),
      this.listRoom(true, this.orderBy.ongoing, 'ongoing'),
      this.listRoom(true, this.orderBy.flow_start, 'flow_start'),
      this.listDiscussions(),
    ]).then(() => {
      this.initialLoaded = true;
    });
  },
  methods: {
    ...mapActions(useRooms, {
      setActiveRoom: 'setActiveRoom',
      getAllRooms: 'getAll',
    }),
    ...mapActions(useDiscussions, {
      setActiveDiscussion: 'setActiveDiscussion',
      getAllDiscussion: 'getAll',
    }),
    updateRoomsCount(newSize, oldSize, key) {
      if (newSize === oldSize || !this.initialLoaded || this.isLoadingRooms)
        return;

      newSize > oldSize ? this.roomsCount[key]++ : this.roomsCount[key]--;
    },
    async openRoom(room) {
      await this.setActiveDiscussion(null);
      await this.setActiveRoom(room);
    },
    async openDiscussion(discussion) {
      await this.setActiveDiscussion(discussion);
    },
    clearField() {
      this.nameOfContact = '';
    },
    async listRoom(
      concat,
      order = this.orderBy[this.activeTab],
      roomsType = '',
      silent = false,
    ) {
      this.showLoadingRooms = silent ? false : !concat;
      const { viewedAgent } = this;
      try {
        this.isLoadingRooms = true;
        const offset =
          (roomsType ? this.page[roomsType] : this.page.search) * this.limit;

        await this.getAllRooms({
          offset: offset,
          concat,
          order,
          limit: this.limit,
          contact: this.nameOfContact,
          viewedAgent,
          roomsType,
        });
      } catch (error) {
        console.error('Error listing rooms', error);
      } finally {
        this.showLoadingRooms = false;
        this.isLoadingRooms = false;
      }
    },
    searchForMoreRooms() {
      if (this.listRoomHasNext[this.activeTab]) {
        this.page[this.activeTab] += 1;
        this.listRoom(true, this.orderBy[this.activeTab], this.activeTab);
      } else if (this.nameOfContact) {
        this.page.search += 1;
        this.listRoom(true, this.orderBy[this.activeTab]);
      }
    },
    async listDiscussions() {
      try {
        const { viewedAgent } = this;
        await this.getAllDiscussion({
          viewedAgent,
          filters: { search: this.nameOfContact },
        });
      } catch (error) {
        console.error('Error listing discussions', error);
      }
    },
    handleScroll(target) {
      if (
        target.offsetHeight + Math.ceil(target.scrollTop) >=
        target.scrollHeight
      ) {
        this.searchForMoreRooms(true);
      }
    },
    handleModalQueuePriorization() {
      this.showModalQueue = !this.showModalQueue;
    },
    async handlePinRoom(room, type) {
      const isLoadingSamePinRoom =
        this.pinRoomLoading.status && this.pinRoomLoading.uuid === room.uuid;

      if (
        (room.is_pinned && type === 'pin') ||
        (!room.is_pinned && type === 'unpin') ||
        isLoadingSamePinRoom
      ) {
        return;
      }

      const types = {
        pin: {
          request: () => Room.pinRoom({ uuid: room.uuid, status: true }),
          successMessage: this.$t('chats.room_pin.success_pin'),
          type: 'success',
        },
        unpin: {
          request: () => Room.pinRoom({ uuid: room.uuid, status: false }),
          successMessage: this.$t('chats.room_pin.success_unpin'),
          type: 'default',
        },
      };

      if (this.maxPinLimit === this.totalPinnedRooms && type === 'pin') {
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('chats.room_pin.error_pin_limit', {
              max_pin_limit: this.maxPinLimit,
            }),
            type: 'default',
          },
          seconds: 2,
        });

        return;
      }

      try {
        this.pinRoomLoading = {
          status: true,
          uuid: room.uuid,
        };
        await types[type].request();
        await this.listRoom(
          true,
          this.orderBy[this.activeTab],
          'ongoing',
          true,
        );
        unnnic.unnnicCallAlert({
          props: {
            text: types[type].successMessage,
            type: types[type].type,
          },
          seconds: 2,
        });
      } catch (error) {
        console.error('Pin room error', error);
        let errorText = '';

        if (error.response?.status === 401) {
          errorText = this.$t('chats.errors.401');
        } else if (error.response?.status === 403) {
          errorText = this.$t('chats.room_pin.error_403');
        } else if (error.response?.status === 404) {
          errorText = this.$t('chats.room_pin.error_404');
        } else if (error.response?.status === 400) {
          errorText = this.$t('chats.room_pin.error_pin_limit', {
            max_pin_limit: this.maxPinLimit,
          });
        } else {
          errorText = this.$t('chats.errors.default');
        }

        unnnic.unnnicCallAlert({
          props: {
            text: errorText,
            type: 'error',
          },
          seconds: 2,
        });
      } finally {
        this.pinRoomLoading = {
          status: false,
          uuid: '',
        };
      }
    },
    handleMostRecentFilter() {
      const orderByValue =
        this.activeTab === 'waiting' ? '-created_on' : '-last_interaction';

      this.orderBy[this.activeTab] = orderByValue;

      this.listRoom(true, this.orderBy[this.activeTab], this.activeTab, true);
    },
    handleOlderFilter() {
      const orderByValue =
        this.activeTab === 'waiting' ? 'created_on' : 'last_interaction';

      this.orderBy[this.activeTab] = orderByValue;

      this.listRoom(true, this.orderBy[this.activeTab], this.activeTab, true);
    },
  },
};
</script>
<style lang="scss" scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  .chat-groups__header {
    display: grid;
    gap: $unnnic-spacing-xs;
    grid-template-columns: auto 1fr;
  }
  .chat-groups {
    display: flex;
    flex-direction: column;
    margin-top: $unnnic-spacing-sm;
    margin-right: -$unnnic-spacing-xs; // For the scrollbar to stick to the edge
    overflow-y: auto;
    overflow-x: hidden;
    :deep(.unnnic-collapse) {
      padding-bottom: $unnnic-spacing-sm;
    }
    :deep(.unnnic-collapse__header) {
      padding-left: $unnnic-spacing-xs;
      padding-right: $unnnic-spacing-xs;
    }
    .no-results {
      padding-left: $unnnic-spacing-xs;
      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-gt;
    }
    &__header {
      padding-left: $unnnic-spacing-xs;
    }
    &__search-contact-input {
      padding-left: $unnnic-spacing-xs;
    }
    &__tabs {
      display: flex;
      flex-wrap: wrap;
      gap: $unnnic-spacing-xs;
      padding-left: $unnnic-spacing-xs;
      padding-right: $unnnic-spacing-xs;
    }
  }
  .order-by {
    display: flex;
    padding: $unnnic-spacing-ant $unnnic-spacing-xs;
    justify-content: space-between;
    gap: $unnnic-spacing-xs;
    align-items: center;
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;

    .apply-filter {
      cursor: pointer;
    }

    .filter-active {
      font-weight: $unnnic-font-weight-bold;
    }
  }
}
.room-container__chats-margin-y {
  margin: $unnnic-spacing-xs 0;
}
</style>
