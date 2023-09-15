<template>
  <section :class="['chats-layout', isAsideVisible && 'has-aside']">
    <section
      v-if="showSendFlowMessage"
      :style="{ display: 'flex', flexDirection: 'column', height: '96vh' }"
      class="room-list"
    >
      <layout-template-message
        :selectedContact="this.$store.state.rooms.activeRoom.contact"
        @close="handlerShowSendFlowMessages"
      />
    </section>
    <slot name="room-list" v-if="isRoomListVisible">
      <div class="sidebar">
        <preferences-bar
          @show-quick-messages="handlerShowQuickMessages"
          :dashboard="canAccessDashboard"
        />

        <div class="template-message-button" v-if="canTriggerFlows">
          <unnnic-button-icon
            size="small"
            icon="pencil-write-1"
            style="width: 100%"
            @click="showContactsList"
          />
        </div>

        <the-room-list class="room-list" :disabled="disabledChatList" />
      </div>
    </slot>

    <slot name="template-message" v-if="contactListVisible">
      <div :style="{ display: 'flex', flexDirection: 'column', height: '100vh' }">
        <contact-list class="room-list" :disabled="disabledChatList" @close="closeContactList" />
      </div>
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
    <div v-show="isLoading && disabledChatList">
      <skeleton-loading />
    </div>
  </section>
</template>

<script>
import PreferencesBar from '@/components/PreferencesBar.vue';
import Sector from '@/services/api/resources/settings/sector.js';
import TemplateMessages from '@/services/api/resources/chats/templateMessage.js';
import SkeletonLoading from '@/views/loadings/chats.vue';
import QuickMessages from '@/components/chats/QuickMessages';
import LayoutTemplateMessage from '@/components/chats/TemplateMessages/LayoutTemplateMessage';
import TheRoomList from './components/TheRoomList';
import ContactList from './components/TemplateMessages';

export default {
  name: 'ChatsLayout',

  components: {
    PreferencesBar,
    TheRoomList,
    // ModalOnBoardingChats,
    SkeletonLoading,
    ContactList,
    QuickMessages,
    LayoutTemplateMessage,
  },

  props: {
    disabledChatList: {
      type: Boolean,
      default: false,
    },
  },

  mounted() {
    this.getCountSectors();
    this.havePermissionToSendTemplateMessage();
  },

  data: () => ({
    sectors: {},
    isLoading: false,
    contactList: false,
    canTriggerFlows: false,
    canAccessDashboard: false,
    showQuickMessages: false,
    showSendFlowMessage: false,
    quickMessage: '',
  }),

  methods: {
    handlerShowQuickMessages() {
      this.showQuickMessages = !this.showQuickMessages;
    },
    handlerShowSendFlowMessages() {
      this.showSendFlowMessage = !this.showSendFlowMessage;
    },
    close() {
      if (this.$slots.aside[0].componentOptions.listeners) {
        this.$slots.aside[0].componentOptions.listeners.close();
      }
      this.showSendFlowMessage = false;
    },

    showContactsList() {
      this.contactList = true;
    },

    closeContactList() {
      this.contactList = false;
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
    async havePermissionToSendTemplateMessage() {
      try {
        const response = await TemplateMessages.listAccess();
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
      return !this.contactList && !this.showQuickMessages && !this.showSendFlowMessage;
    },
    contactListVisible() {
      return this.contactList && !this.showQuickMessages && !this.showSendFlowMessage;
    },
    quickMessagesVisible() {
      return !this.contactList && !this.showSendFlowMessage && this.showQuickMessages;
    },
  },
};
</script>

<style lang="scss" scoped>
$aside-width: 300px;

section.chats-layout {
  padding: 0;

  height: 100vh;
  max-height: 100vh;
  overflow-y: hidden;
  display: grid;
  grid-template-columns: $aside-width auto;

  & > *:not(:last-child) {
    border-right: 1px solid $unnnic-color-neutral-soft;
  }

  &.has-aside {
    grid-template-columns: $aside-width auto $aside-width;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;

    height: 100vh;
    width: $aside-width;
    min-width: $aside-width;

    padding: 0 0 $unnnic-spacing-sm $unnnic-spacing-xs;

    grid-column: 1;

    .room-list {
      overflow-y: auto;
    }

    & > * {
      padding-right: $unnnic-spacing-xs;
    }
  }

  main {
    flex: 1 1;
    grid-column: 2;

    height: 100vh;

    background-color: $unnnic-color-background-carpet;
  }

  .quick-message {
    grid-column: 1;

    display: flex;
    flex-direction: column;

    height: 100vh;
    width: $aside-width;
    min-width: $aside-width;

    border: 1px solid $unnnic-color-neutral-soft;
  }

  .aside {
    height: 100vh;
    width: $aside-width;
    min-width: $aside-width;
    background: $unnnic-color-background-grass;

    grid-column: 3;
  }
}
</style>
