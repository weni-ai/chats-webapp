<template>
  <section :class="['chats-layout', isAsideVisible && 'has-aside']">
    <slot name="room-list" v-if="isRoomListVisible">
      <div class="sidebar">
        <preferences-bar
          @show-quick-messages="handlerShowQuickMessages"
          :dashboard="canAccessDashboard"
        />

        <div class="flows-trigger-button" v-if="canTriggerFlows">
          <unnnic-button-next
            size="small"
            type="terciary"
            iconCenter="pencil-write-1"
            @click="openFlowsTrigger"
          />
        </div>

        <the-room-list class="room-list" />
      </div>
    </slot>

    <slot name="flows-trigger" v-if="flowsTriggerVisible">
      <layout-flows-trigger
        class="room-list"
        :selectedContact="flowsTriggerContact"
        @close="closeFlowsTrigger"
      />
    </slot>

    <slot name="quick-message" v-if="quickMessagesVisible">
      <div class="quick-message">
        <quick-messages
          class="room-list"
          @close="handlerShowQuickMessages"
          @select-quick-message="selectQuickMessage"
        />
      </div>
    </slot>
    <main>
      <slot />
    </main>
    <section v-if="isAsideVisible" class="aside">
      <slot name="aside" />
    </section>
    <!-- <div v-show="isLoading">
      <skeleton-loading />
    </div> -->
  </section>
</template>

<script>
import PreferencesBar from '@/components/PreferencesBar.vue';
import Sector from '@/services/api/resources/settings/sector.js';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
// import SkeletonLoading from '@/views/loadings/chats.vue';
import QuickMessages from '@/components/chats/QuickMessages';
import TheRoomList from './components/TheRoomList';
import LayoutFlowsTrigger from './components/FlowsTrigger';

export default {
  name: 'ChatsLayout',

  components: {
    PreferencesBar,
    TheRoomList,
    // SkeletonLoading,
    LayoutFlowsTrigger,
    QuickMessages,
  },

  mounted() {
    this.getCountSectors();
    this.getPermissionToSendFlowsTrigger();
  },

  data: () => ({
    sectors: {},
    isLoading: false,
    canTriggerFlows: false,
    canAccessDashboard: false,
    showFlowsTrigger: false,
    showQuickMessages: false,
    flowsTriggerContact: null,
    quickMessage: '',
  }),

  methods: {
    handlerShowQuickMessages() {
      this.showQuickMessages = !this.showQuickMessages;
    },
    openFlowsTrigger({ contact = null }) {
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
    close() {
      if (this.$slots.aside[0].componentOptions.listeners) {
        this.$slots.aside[0].componentOptions.listeners.close();
      }
      this.showFlowsTrigger = false;
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
        this.canTriggerFlows = this.accessList.can_trigger_flows;
        this.canAccessDashboard = this.accessList.can_access_dashboard;
      } catch (error) {
        console.log(error);
      }
    },
    selectQuickMessage(quickMessage) {
      this.$emit('select-quick-message', quickMessage);
    },
  },

  computed: {
    isAsideVisible() {
      return !!this.$slots.aside;
    },
    isRoomListVisible() {
      return !this.showFlowsTrigger && !this.showQuickMessages;
    },
    flowsTriggerVisible() {
      return this.showFlowsTrigger && !this.showQuickMessages;
    },
    quickMessagesVisible() {
      return !this.showFlowsTrigger && this.showQuickMessages;
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

  overflow: hidden;

  & > *:not(:last-child) {
    border-right: 1px solid $unnnic-color-neutral-soft;
  }

  &.has-aside {
    grid-template-columns: 3fr 6fr 3fr;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;

    height: 100vh;

    padding: 0 0 $unnnic-spacing-xs $unnnic-spacing-xs;

    grid-column: 1;

    .flows-trigger-button {
      button {
        width: 100%;
      }
    }

    .room-list {
      overflow-y: auto;
    }

    & > * {
      padding-right: $unnnic-spacing-xs;
    }
  }

  main {
    grid-column: 2;

    height: 100vh;

    background-color: $unnnic-color-background-carpet;
  }

  .quick-message {
    grid-column: 1;

    display: flex;
    flex-direction: column;

    height: 100vh;

    border: 1px solid $unnnic-color-neutral-soft;
  }

  .aside {
    height: 100vh;
    background: $unnnic-color-background-grass;

    grid-column: 3;
  }
}
</style>
