<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    ref="cardGroup"
    class="container"
  >
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
    <section class="filter-tags__container">
      <template
        v-for="(tab, tabIndex) in tabs"
        :key="tab"
      >
        <FilterTag
          v-if="
            (tab === $t('discussion')
              ? discussions.length > 0
              : roomsCount[tabsKeyMapper[tab]] > 0) && !isSearching
          "
          :label="tab"
          :count="
            tab === $t('discussion')
              ? discussions.length
              : roomsCount[tabsKeyMapper[tab]]
          "
          :active="activeTab === tab"
          @click="handleChangeActiveTab(tabIndex)"
        />
      </template>
    </section>

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
    <RoomsListLoading v-if="showLoadingRooms" />
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
        v-if="activeTab === $t('discussion')"
        :discussions="discussions"
        @open="openDiscussion"
      />
      <CardGroup
        v-else-if="activeRooms.length"
        :rooms="activeRooms"
        :withSelection="
          !isMobile &&
          project.config?.can_use_bulk_transfer &&
          activeTab === $t('in_progress')
        "
        @open="openRoom"
      />
      <p
        v-else
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
import { mapActions, mapState, mapWritableState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';

import RoomsListLoading from '@/views/loadings/RoomsList.vue';
import CardGroup from './CardGroup/index.vue';
import ModalQueuePriorizations from '@/components/ModalQueuePriorizations.vue';
import FilterTag from './Tag.vue';

import Room from '@/services/api/resources/chats/room';

export default {
  name: 'TheCardGroups',
  components: {
    RoomsListLoading,
    CardGroup,
    ModalQueuePriorizations,
    FilterTag,
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
        in_progress: 0,
        waiting: 0,
        sent_flows: 0,
        discussion: 0,
        search: 0,
      },
      limit: 20,
      nameOfContact: '',
      timerId: 0,
      showLoadingRooms: false,
      isLoadingRooms: false,
      createdOnFilter: false,
      lastCreatedFilter: true,
      isSearching: false,
      isMobile: isMobile(),
      showModalQueue: false,
      noQueueSelected: false,
      activeTabIndex: 0,
      initialLoaded: false,
    };
  },
  computed: {
    ...mapState(useRooms, {
      rooms: 'rooms',
      rooms_in_progress: 'agentRooms',
      rooms_queue: 'waitingQueue',
      rooms_sent_flows: 'waitingContactAnswer',
      listRoomHasNext: 'hasNextRooms',
      newMessagesByRoom: 'newMessagesByRoom',
    }),
    ...mapWritableState(useRooms, ['roomsCount', 'selectedRoomsToTransfer']),
    ...mapState(useConfig, ['project']),
    ...mapState(useProfile, ['me']),
    ...mapState(useDiscussions, ['discussions']),

    tabs() {
      return [
        this.$t('in_progress'),
        this.$t('waiting'),
        this.$t('sent_flows'),
        this.$t('discussion'),
      ];
    },

    activeTab() {
      return this.tabs[this.activeTabIndex];
    },

    tabsKeyMapper() {
      return {
        [this.$t('in_progress')]: 'in_progress',
        [this.$t('waiting')]: 'waiting',
        [this.$t('sent_flows')]: 'sent_flows',
        [this.$t('discussion')]: 'discussion',
      };
    },

    activeTabKey() {
      return this.tabsKeyMapper[this.activeTab] || '';
    },

    activeRooms() {
      if (this.isSearching) return this.rooms;

      const mapper = {
        in_progress: this.rooms_in_progress,
        waiting: this.rooms_queue,
        sent_flows: this.rooms_sent_flows,
      };

      return mapper[this.activeTabKey] || [];
    },
    isUserAdmin() {
      const ROLE_ADMIN = 1;
      return this.me.project_permission_role === ROLE_ADMIN;
    },
    totalUnreadMessages() {
      return this.rooms_in_progress.reduce(
        (total, room) =>
          total + (this.newMessagesByRoom[room.uuid]?.messages?.length || 0),
        0,
      );
    },
    showNoResultsError() {
      return (
        !this.showLoadingRooms &&
        this.rooms_in_progress.length === 0 &&
        this.rooms_queue.length === 0 &&
        this.rooms_sent_flows.length === 0 &&
        this.discussions.length === 0
      );
    },
  },
  watch: {
    rooms_in_progress: {
      deep: true,
      handler(newRooms, oldRooms) {
        this.updateRoomsCount(newRooms, oldRooms, 'in_progress');
      },
    },
    rooms_queue: {
      deep: true,
      handler(newRooms, oldRooms) {
        this.updateRoomsCount(newRooms, oldRooms, 'waiting');
      },
    },
    rooms_sent_flows: {
      deep: true,
      handler(newRooms, oldRooms) {
        this.updateRoomsCount(newRooms, oldRooms, 'sent_flows');
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
        const TIME_TO_WAIT_TYPING = 800;
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
    await Promise.all([
      this.listRoom(true, '-last_interaction', 'waiting'),
      this.listRoom(true, '-last_interaction', 'in_progress'),
      this.listRoom(true, '-last_interaction', 'sent_flows'),
      this.listDiscussions(),
    ]);

    if (this.$route.name === 'room' && this.$route.params.roomId) {
      const room = await Room.getByUuid({ uuid: this.$route.params.roomId });
      const viewRoom = this.checkUserSeenRoom({
        room,
        viewedAgentEmail: this.viewedAgent.email,
        userEmail: this.me.email,
      });
      if (!viewRoom || !room.is_active) this.$router.push('/rooms');
      else this.setActiveRoom({ ...room, hasDetailInfo: true });
    }

    this.initialLoaded = true;
  },

  methods: {
    ...mapActions(useRooms, {
      setActiveRoom: 'setActiveRoom',
      getAllRooms: 'getAll',
      checkUserSeenRoom: 'checkUserSeenRoom',
    }),
    ...mapActions(useDiscussions, {
      setActiveDiscussion: 'setActiveDiscussion',
      getAllDiscussion: 'getAll',
    }),
    handleChangeActiveTab(tabIndex) {
      if (this.activeTabIndex !== tabIndex) this.selectedRoomsToTransfer = [];
      this.activeTabIndex = tabIndex;
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
    updateRoomsCount(newRooms, oldRooms, key) {
      const newSize = newRooms.length;
      const oldSize = oldRooms.length;

      if (newSize === oldSize || !this.initialLoaded || this.isLoadingRooms)
        return;

      newSize > oldSize ? this.roomsCount[key]++ : this.roomsCount[key]--;
    },
    async listRoom(concat, order = '-last_interaction', filterFlag = '') {
      this.showLoadingRooms = !concat;
      const { viewedAgent } = this;
      const activeTabKey = this.tabsKeyMapper[this.activeTab];
      try {
        this.isLoadingRooms = true;
        await this.getAllRooms({
          offset:
            (filterFlag ? this.page[activeTabKey] : this.page.search) *
            this.limit,
          concat,
          order,
          limit: this.limit,
          contact: this.nameOfContact,
          viewedAgent,
          filterFlag,
        });
      } catch {
        console.error('Não foi possível listar as salas');
      } finally {
        this.showLoadingRooms = false;
        this.isLoadingRooms = false;
      }
    },
    searchForMoreRooms() {
      const activeTabKey = this.tabsKeyMapper[this.activeTab];
      if (this.listRoomHasNext[activeTabKey]) {
        this.page[activeTabKey] += 1;
        this.listRoom(
          true,
          '-last_interaction',
          this.tabsKeyMapper[this.activeTab],
        );
      } else if (this.nameOfContact) {
        this.page.search += 1;
        this.listRoom(true, '-last_interaction');
      }
    },
    async listDiscussions() {
      try {
        const { viewedAgent } = this;
        await this.getAllDiscussion({
          viewedAgent,
          filters: { search: this.nameOfContact },
        });
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
  gap: $unnnic-spacing-ant;
  .filter-tags {
    &__container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;

      @media (max-width: 1300px) {
        gap: $unnnic-spacing-nano;
        grid-template-columns: 1fr 1fr;
      }

      @media (max-width: 700px) {
        gap: $unnnic-spacing-nano;
        grid-template-columns: 1fr;
      }
    }
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
    width: 100%;
    .apply-filter {
      margin-left: auto;
    }
  }
}
</style>
