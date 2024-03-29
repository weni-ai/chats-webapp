<template>
  <section
    :class="[
      'chats-layout',
      isAsideVisible && 'has-aside',
      isViewMode && 'view-mode',
    ]"
  >
    <slot
      name="room-list"
      v-if="isRoomListVisible"
    >
      <SidebarLoading v-show="isLoadingSidebar" />
      <div
        v-show="!isLoadingSidebar"
        class="sidebar"
      >
        <PreferencesBar
          v-if="!isViewMode"
          @show-quick-messages="handlerShowQuickMessages"
          :dashboard="canAccessDashboard"
        />

        <div
          class="flows-trigger-button"
          v-if="!isViewMode"
        >
          <UnnnicButton
            v-if="canTriggerFlows"
            size="small"
            type="secondary"
            iconCenter="send"
            @click="openFlowsTrigger"
          />
        </div>

        <TheCardGroups
          class="room-list"
          :isViewMode="isViewMode"
          :viewedAgent="viewedAgent"
        />

        <UnnnicButton
          class="history-button"
          :text="isHistoryView ? $t('back_to_chats') : $t('chats.see_history')"
          :iconLeft="isHistoryView ? 'keyboard-arrow-left-1' : 'history'"
          type="secondary"
          size="small"
          @click="navigate(isHistoryView ? 'home' : 'closed-rooms')"
        />
      </div>
    </slot>

    <slot
      name="flows-trigger"
      v-if="flowsTriggerVisible"
    >
      <LayoutFlowsTrigger
        class="room-list"
        :selectedContact="flowsTriggerContact"
        @close="closeFlowsTrigger"
      />
    </slot>

    <slot
      name="quick-message"
      v-if="quickMessagesVisible"
    >
      <div class="quick-message">
        <QuickMessages
          class="room-list"
          @close="handlerShowQuickMessages"
          @select-quick-message="selectQuickMessage"
        />
      </div>
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
import SidebarLoading from '@/views/loadings/HomeSidebar';
import PreferencesBar from '@/components/PreferencesBar.vue';
import Sector from '@/services/api/resources/settings/sector.js';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import QuickMessages from '@/components/chats/QuickMessages';
import TheCardGroups from './components/TheCardGroups';
import LayoutFlowsTrigger from './components/FlowsTrigger';

export default {
  name: 'ChatsLayout',

  components: {
    PreferencesBar,
    TheCardGroups,
    SidebarLoading,
    LayoutFlowsTrigger,
    QuickMessages,
  },

  props: {
    viewedAgent: {
      type: String,
      default: '',
    },
  },

  async mounted() {
    await this.getCountSectors();
    await this.getPermissionToSendFlowsTrigger();
    this.isLoadingSidebar = false;
  },

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
    navigate(name) {
      this.$router.push({
        name,
      });
    },
  },

  computed: {
    isAsideVisible() {
      return (
        !!this.$slots.aside &&
        this.$slots.aside.filter((slot) => slot.componentOptions).length > 0
      );
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
    isHistoryView() {
      return this.$route.name === 'closed-rooms';
    },
    isViewMode() {
      return !!this.viewedAgent;
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

  overflow: hidden;

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
    gap: $unnnic-spacing-stack-xs;

    height: 100%;

    padding: 0 0 $unnnic-spacing-xs $unnnic-spacing-xs;

    grid-column: 1;

    .flows-trigger-button {
      button {
        width: 100%;
      }
    }

    .history-button {
      margin-right: $unnnic-spacing-xs;
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

    height: 100%;

    background-color: $unnnic-color-background-carpet;
  }

  .quick-message {
    grid-column: 1;

    display: flex;
    flex-direction: column;

    height: 100%;
  }

  .aside {
    height: 100%;
    background: $unnnic-color-background-snow;

    grid-column: 3;
  }
}
</style>
