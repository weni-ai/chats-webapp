<template>
  <section
    :class="[
      'chats-layout',
      isAsideVisible && 'has-aside',
      isViewMode && 'view-mode',
    ]"
  >
    <slot
      v-if="isRoomListVisible"
      name="room-list"
    >
      <SidebarLoading v-show="isLoadingSidebar" />
      <div
        v-show="!isLoadingSidebar"
        class="sidebar"
      >
        <StatusBar v-if="!isViewMode" />

        <TheCardGroups
          class="room-list"
          :isViewMode="isViewMode"
          :viewedAgent="viewedAgent"
        />

        <ChatsLayoutFooterButton class="footer-button" />

        <ViewOptions
          :isViewMode="isViewMode"
          :dashboard="canAccessDashboard"
          :showFlowsTriggerButton="canTriggerFlows"
          @open-flows-trigger="openFlowsTrigger"
          @show-quick-messages="$emit('show-quick-messages')"
        />
      </div>
    </slot>

    <slot
      v-if="flowsTriggerVisible"
      name="flows-trigger"
    >
      <LayoutFlowsTrigger
        class="room-list"
        :selectedContact="flowsTriggerContact"
        @close="closeFlowsTrigger"
      />
    </slot>

    <main>
      <slot />
    </main>
    <section
      v-if="isAsideVisible"
      class="aside"
    >
      <slot name="aside" />
    </section>
  </section>
</template>

<script>
import SidebarLoading from '@/views/loadings/HomeSidebar.vue';
import TheCardGroups from './components/TheCardGroups/index.vue';
import LayoutFlowsTrigger from './components/FlowsTrigger/index.vue';
import ChatsLayoutFooterButton from './components/FooterButton/index.vue';
import ViewOptions from './components/ViewOptions/index.vue';

import Sector from '@/services/api/resources/settings/sector.js';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import StatusBar from '@/components/StatusBar.vue';

export default {
  name: 'ChatsLayout',

  components: {
    TheCardGroups,
    SidebarLoading,
    LayoutFlowsTrigger,
    ChatsLayoutFooterButton,
    ViewOptions,
    StatusBar,
  },

  props: {
    viewedAgent: {
      type: String,
      default: '',
    },
  },
  emits: ['select-quick-message', 'show-quick-messages'],

  data: () => ({
    sectors: {},
    isLoading: false,
    isLoadingSidebar: true,
    canTriggerFlows: false,
    canAccessDashboard: false,
    showFlowsTrigger: false,
    showQuickMessages: false,
    flowsTriggerContact: null,
    quickMessage: '',
  }),

  computed: {
    isAsideVisible() {
      const asideSlot = this.$slots.aside ? this.$slots.aside() : [];
      return asideSlot.some(
        (slot) => slot.type && typeof slot.type === 'object',
      );
    },
    isRoomListVisible() {
      return !this.showFlowsTrigger && !this.showQuickMessages;
    },
    flowsTriggerVisible() {
      return this.showFlowsTrigger && !this.showQuickMessages;
    },
    isViewMode() {
      return !!this.viewedAgent;
    },
  },

  async mounted() {
    await this.getCountSectors();
    await this.getPermissionToSendFlowsTrigger();
    this.isLoadingSidebar = false;
  },

  methods: {
    openFlowsTrigger({ contact = null } = {}) {
      if (contact) {
        this.flowsTriggerContact = contact;
      }
      this.showFlowsTrigger = true;
    },
    closeFlowsTrigger() {
      this.showFlowsTrigger = false;
      if (this.flowsTriggerContact) {
        this.flowsTriggerContact = null;
      }
    },

    async getCountSectors() {
      try {
        this.isLoading = true;
        const response = await Sector.countOfSectorsAvaible();
        this.sectors = response.sector_count;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.log(error);
      }
    },
    async getPermissionToSendFlowsTrigger() {
      try {
        const response = await FlowsTrigger.listAccess();
        this.accessList = response;
        this.canTriggerFlows =
          this.accessList.can_trigger_flows && !this.isViewMode;
        this.canAccessDashboard = this.accessList.can_access_dashboard;
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
section.chats-layout {
  padding: 0;

  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;

  display: grid;
  grid-template-columns: 3fr 9fr;
  grid-template-rows: 100vh;

  overflow: hidden;

  & > *:not(:last-child) {
    border-right: 1px solid $unnnic-color-neutral-soft;
  }

  &.has-aside {
    grid-template-columns: 3fr 6fr 3fr;
  }

  &.view-mode {
    $viewModeHeaderHeight: 40px;

    position: relative;

    padding-top: $viewModeHeaderHeight;
    grid-template-rows: calc(100vh - $viewModeHeaderHeight);
  }

  .sidebar {
    display: flex;
    flex-direction: column;

    height: 100%;

    padding: 0;

    grid-column: 1;

    .room-list {
      overflow-y: auto;
    }

    & > * {
      padding-right: $unnnic-spacing-xs;
    }
  }

  main {
    grid-column: 2;

    height: 100%;

    background-color: rgba(253, 245, 233, 0.25);
  }

  .aside {
    height: 100%;
    background: $unnnic-color-background-snow;

    grid-column: 3;
  }
}
</style>
