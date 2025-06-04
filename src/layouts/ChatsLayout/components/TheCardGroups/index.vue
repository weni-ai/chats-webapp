<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <UnnnicInput
      v-model="nameOfContact"
      iconLeft="search-1"
      :iconRight="nameOfContact ? 'close-1' : ''"
      :iconRightClickable="true"
      size="sm"
      :placeholder="$t('chats.search_contact')"
      class="chat-groups__search-contact-input"
      @icon-right-click="nameOfContact = ''"
    />
    <section class="chat-groups__header">
      <UnnnicToolTip
        v-if="
          !isMobile &&
          !isUserAdmin &&
          project.config?.can_use_queue_prioritization
        "
        enabled
        :text="$t('chats.select_queues')"
        side="right"
      >
        <UnnnicButton
          iconCenter="filter_list"
          type="secondary"
          size="small"
          @click="handleModalQueuePriorization"
        />
      </UnnnicToolTip>
      <div class="order-by">
        <div>
          <span>{{ $t('chats.room_list.order_by') }}</span>
        </div>
        <div class="apply-filter">
          <span
            :class="{ 'filter-active': lastCreatedFilter }"
            @click="handleMostRecentFilter"
            >{{ $t('chats.room_list.most_recent') }}</span
          >
          <span> | </span>
          <span
            :class="{ 'filter-active': createdOnFilter }"
            @click="handleOlderFilter"
          >
            {{ $t('chats.room_list.older') }}</span
          >
        </div>
      </div>
    </section>
    <RoomsListLoading v-if="isLoadingRooms" />
    <section
      v-else
      class="chat-groups"
      @scroll="
        (event) => {
          handleScroll(event.srcElement);
        }
      "
    >
      <CardGroup
        v-if="discussions.length"
        :label="$t('chats.discussions', { length: discussions.length })"
        :discussions="discussions"
        @open="openDiscussion"
      />
      <CardGroup
        v-if="rooms_queue.length"
        :label="$t('chats.waiting', { length: rooms_queue.length })"
        :rooms="rooms_queue"
        roomsType="waiting"
        @open="openRoom"
      />
      <CardGroup
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        :withSelection="!isMobile && project.config?.can_use_bulk_transfer"
        roomsType="in_progress"
        @open="openRoom"
        @pin="handlePinRoom"
      />
      <CardGroup
        v-if="rooms_sent_flows.length"
        :label="$t('chats.sent_flows', { length: rooms_sent_flows.length })"
        :rooms="rooms_sent_flows"
        @open="openRoom"
      />
      <p
        v-if="showNoResultsError"
        class="no-results"
      >
        {{ isSearching ? $t('without_results') : $t('without_chats') }}
      </p>
    </section>
    <ModalQueuePriorizations
      v-if="showModalQueue"
      @close="handleModalQueuePriorization"
    />
  </div>
</template>
<script>
import isMobile from 'is-mobile';
import { mapActions, mapState } from 'pinia';
import unnnic from '@weni/unnnic-system';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';

import RoomsListLoading from '@/views/loadings/RoomsList.vue';
import CardGroup from './CardGroup/index.vue';
import ModalQueuePriorizations from '@/components/ModalQueuePriorizations.vue';
import Room from '@/services/api/resources/chats/room';

export default {
  name: 'TheCardGroups',
  components: {
    RoomsListLoading,
    CardGroup,
    ModalQueuePriorizations,
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
  data: () => ({
    page: 0,
    limit: 100,
    nameOfContact: '',
    timerId: 0,
    isLoadingRooms: false,
    createdOnFilter: false,
    lastCreatedFilter: true,
    isSearching: false,
    isMobile: isMobile(),
    showModalQueue: false,
    noQueueSelected: false,
    pinRoomLoading: {
      status: false,
      uuid: '',
    },
    orderBy: '-last_interaction',
  }),
  computed: {
    ...mapState(useRooms, {
      rooms: 'agentRooms',
      rooms_queue: 'waitingQueue',
      rooms_sent_flows: 'waitingContactAnswer',
      listRoomHasNext: 'hasNextRooms',
      newMessagesByRoom: 'newMessagesByRoom',
      maxPinLimit: 'maxPinLimit',
    }),
    ...mapState(useConfig, ['project', 'enableAutomaticRoomRouting']),
    ...mapState(useProfile, ['me']),
    ...mapState(useDiscussions, ['discussions']),

    isUserAdmin() {
      const ROLE_ADMIN = 1;
      return this.me.project_permission_role === ROLE_ADMIN;
    },
    totalUnreadMessages() {
      return this.rooms.reduce(
        (total, room) =>
          total + (this.newMessagesByRoom[room.uuid]?.messages?.length || 0),
        0,
      );
    },
    showNoResultsError() {
      return (
        !this.isLoadingRooms &&
        this.rooms.length === 0 &&
        this.rooms_queue.length === 0 &&
        this.rooms_sent_flows.length === 0 &&
        this.discussions.length === 0
      );
    },
    totalPinnedRooms() {
      return this.rooms.filter((room) => room.is_pinned).length || 0;
    },
  },
  watch: {
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
          this.page = 0;
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
  mounted() {
    this.listRoom();
    this.listDiscussions();
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
    async openRoom(room) {
      if (
        this.enableAutomaticRoomRouting &&
        room.user?.email !== this.me?.email
      ) {
        return;
      }

      await this.setActiveDiscussion(null);
      await this.setActiveRoom(room);
    },
    async openDiscussion(discussion) {
      await this.setActiveDiscussion(discussion);
    },
    clearField() {
      this.nameOfContact = '';
    },
    async listRoom(concat, order = this.orderBy, noLoading = false) {
      this.isLoadingRooms = !noLoading;
      const { viewedAgent } = this;
      try {
        await this.getAllRooms({
          offset: this.page * this.limit,
          concat,
          order,
          limit: this.limit,
          contact: this.nameOfContact,
          viewedAgent,
        });
      } catch (error) {
        console.error('Error listing rooms', error);
      } finally {
        this.isLoadingRooms = false;
      }
    },
    searchForMoreRooms() {
      if (this.listRoomHasNext) {
        this.page += 1;
        this.listRoom(true, this.orderBy, true);
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
        },
        unpin: {
          request: () => Room.pinRoom({ uuid: room.uuid, status: false }),
          successMessage: this.$t('chats.room_pin.success_unpin'),
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
          seconds: 5,
        });

        return;
      }

      try {
        this.pinRoomLoading = {
          status: true,
          uuid: room.uuid,
        };
        await types[type].request();
        await this.listRoom(false, this.orderBy, true);
        unnnic.unnnicCallAlert({
          props: {
            text: types[type].successMessage,
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        console.error('Pin room error', error);
        let errorText = '';

        if (error.response.status === 401) {
          errorText = this.$t('chats.errors.401');
        } else if (error.response.status === 403) {
          errorText = this.$t('chats.room_pin.error_403');
        } else if (error.response.status === 404) {
          errorText = this.$t('chats.room_pin.error_404');
        } else if (error.response.status === 400) {
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
          seconds: 5,
        });
      } finally {
        this.pinRoomLoading = {
          status: false,
          uuid: '',
        };
      }
    },
    handleMostRecentFilter() {
      this.orderBy = '-last_interaction';
      this.listRoom(false, this.orderBy, true);
      this.createdOnFilter = false;
      this.lastCreatedFilter = true;
    },
    handleOlderFilter() {
      this.orderBy = 'last_interaction';
      this.listRoom(false, this.orderBy, true);
      this.createdOnFilter = true;
      this.lastCreatedFilter = false;
    },
  },
};
</script>
<style lang="scss" scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;
  .chat-groups__header {
    display: grid;
    gap: $unnnic-spacing-xs;
    grid-template-columns: auto 1fr;
  }
  .chat-groups {
    flex: 1 1;
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
  }
  .order-by {
    display: flex;
    justify-content: space-between;
    gap: $unnnic-spacing-xs;
    align-items: center;
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;

    .apply-filter {
      cursor: pointer;
    }

    .filter-active {
      font-weight: 700;
    }
  }
}
</style>
