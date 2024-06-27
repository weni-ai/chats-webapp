<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <UnnnicInput
      v-model="nameOfContact"
      iconLeft="search-1"
      :iconRight="nameOfContact ? 'close-1' : ''"
      :iconRightClickable="true"
      @icon-right-click="nameOfContact = ''"
      size="sm"
      :placeholder="$t('chats.search_contact')"
    ></UnnnicInput>
    <section class="chat-groups__header">
      <UnnnicToolTip
        enabled
        :text="$t('chats.select_queues')"
        side="right"
        v-if="
          !isMobile &&
          !isUserAdmin &&
          project.config?.can_use_queue_prioritization
        "
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
        <div
          class="apply-filter"
          style="cursor: pointer"
        >
          <span
            :style="{
              fontWeight: lastCreatedFilter ? '700' : '400',
            }"
            @click="
              listRoom(false, '-last_interaction'),
                ((lastCreatedFilter = true), (createdOnFilter = false))
            "
            >{{ $t('chats.room_list.most_recent') }}</span
          >
          <span> | </span>
          <span
            :style="{
              fontWeight: createdOnFilter ? '700' : '400',
            }"
            @click="
              listRoom(false, 'last_interaction'),
                ((createdOnFilter = true), (lastCreatedFilter = false))
            "
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
        @open="openRoom"
      />
      <CardGroup
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        @open="openRoom"
        :withSelection="!isMobile && project.config?.can_use_bulk_transfer"
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

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';

import RoomsListLoading from '@/views/loadings/RoomsList.vue';
import CardGroup from './CardGroup/index.vue';
import ModalQueuePriorizations from '@/components/ModalQueuePriorizations.vue';
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
  }),
  mounted() {
    this.listRoom();
    this.listDiscussions();
  },
  computed: {
    ...mapState(useRooms, {
      rooms: 'agentRooms',
      rooms_queue: 'waitingQueue',
      rooms_sent_flows: 'waitingContactAnswer',
      listRoomHasNext: 'hasNextRooms',
      newMessagesByRoom: 'newMessagesByRoom',
    }),
    ...mapState(useConfig, ['project']),
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
          this.listRoom(false);
          if (newNameOfContact) {
            this.isSearching = true;
          } else {
            this.isSearching = false;
          }
        }, TIME_TO_WAIT_TYPING);
      },
    },
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
      await this.setActiveDiscussion(null);
      await this.setActiveRoom(room);
    },
    async openDiscussion(discussion) {
      await this.setActiveDiscussion(discussion);
    },
    clearField() {
      this.nameOfContact = '';
    },
    async listRoom(concat, order = '-last_interaction') {
      this.isLoadingRooms = !concat;
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
      } catch {
        console.error('Não foi possível listar as salas');
      } finally {
        this.isLoadingRooms = false;
      }
    },
    searchForMoreRooms() {
      if (this.listRoomHasNext) {
        this.page += 1;
        this.listRoom(true);
      }
    },
    async listDiscussions() {
      try {
        const { viewedAgent } = this;
        await this.getAllDiscussion({ viewedAgent });
      } catch {
        console.error('Não foi possível listar as discussões');
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
    padding-right: $unnnic-spacing-xs;
    margin-right: -$unnnic-spacing-xs; // For the scrollbar to stick to the edge
    overflow-y: auto;
    overflow-x: hidden;
    :deep(.unnnic-collapse) {
      padding-bottom: $unnnic-spacing-sm;
    }
    .no-results {
      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-gt;
    }
  }
  .order-by {
    display: flex;
    justify-content: space-between;
    gap: $unnnic-spacing-xs;
    align-items: center;
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
  }
}
</style>
