<template>
  <section class="chats-layout unnnic-grid-giant" style="padding: 0px; overflow-y: hidden">
    <section
      v-if="isAsideSlotInUse && this.showQuickMessage && !this.showQuickMessagePreferencesBar"
      class="aside unnnic-grid-span-3"
      style="border: 1px solid #e2e6ed"
    >
      <slot name="aside" />
    </section>
    <slot
      name="room-list"
      v-if="!this.contactList && !this.showQuickMessage && !this.showQuickMessagePreferencesBar"
    >
      <div
        :style="{ display: 'flex', flexDirection: 'column', height: '100vh', paddingLeft: '10px' }"
        class="unnnic-grid-span-3"
      >
        <preferences-bar
          :style="{ margin: '16px 0 0 0px' }"
          @show-quick-messages="preferencesOpenQuickMessage"
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

    <slot
      name="template-message"
      v-if="this.contactList && !this.showQuickMessage && !this.showQuickMessagePreferencesBar"
    >
      <div
        :style="{ display: 'flex', flexDirection: 'column', height: '100vh', paddingLeft: '10px' }"
        class="unnnic-grid-span-3"
      >
        <contact-list class="room-list" :disabled="disabledChatList" @close="closeContactList" />
      </div>
    </slot>
    <slot
      name="quick-message"
      v-if="!this.contactList && !this.showQuickMessage && this.showQuickMessagePreferencesBar"
    >
      <div
        :style="{ display: 'flex', flexDirection: 'column', height: '100vh' }"
        class="unnnic-grid-span-3"
      >
        <quick-messages class="room-list" @close="closeQuickMessages" />
      </div>
    </slot>

    <main
      v-bind:class="[
        isAsideSlotInUse && !this.showQuickMessage && !this.showQuickMessagePreferencesBar
          ? 'unnnic-grid-span-6'
          : 'unnnic-grid-span-9',
      ]"
      style="height: 100vh"
    >
      <slot />
    </main>

    <section
      v-if="isAsideSlotInUse && !this.showQuickMessage"
      class="aside unnnic-grid-span-3"
      style="border: 1px solid #e2e6ed"
    >
      <slot name="aside" />
    </section>
    <!-- <section v-if="sectors === 0">
      <modal-on-boarding-chats />
    </section> -->
    <div v-show="isLoading && disabledChatList">
      <skeleton-loading />
    </div>
  </section>
</template>

<script>
import PreferencesBar from '@/components/PreferencesBar.vue';
// import ModalOnBoardingChats from '@/components/ModalOnBoardingChats.vue';
import Sector from '@/services/api/resources/settings/sector.js';
import TemplateMessages from '@/services/api/resources/chats/templateMessage.js';
import SkeletonLoading from '@/views/loadings/chats.vue';
import QuickMessages from '@/components/chats/QuickMessages';
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
  },

  props: {
    disabledChatList: {
      type: Boolean,
      default: false,
    },
    totalOfSectors: {},
  },
  mounted() {
    this.getCountSectors();
    this.havePermissionToSendTemplateMessage();
  },

  methods: {
    preferencesOpenQuickMessage() {
      this.showQuickMessagePreferencesBar = true;
    },
    closeQuickMessages() {
      this.showQuickMessagePreferencesBar = false;
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
  },

  data: () => ({
    sectors: {},
    isLoading: false,
    contactList: false,
    canTriggerFlows: false,
    canAccessDashboard: false,
    showQuickMessage: false,
    openQuickMessage: false,
    teste: false,
    showQuickMessagePreferencesBar: false,
  }),

  computed: {
    isAsideSlotInUse() {
      if (![null, undefined, ''].includes(this.$slots.aside)) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.showQuickMessage = this.$slots.aside[0].componentOptions.tag === 'QuickMessages';
      } else {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.showQuickMessage = false;
      }
      return !!this.$slots.aside;
    },
  },
};
</script>

<style lang="scss" scoped>
.chats-layout {
  height: 100%;
  max-height: 100%;
  display: flex;

  .room-list {
    margin: {
      top: 8px;
      right: 0;
      bottom: 0;
    }
    overflow-y: auto;
  }

  main {
    flex: 1 1;
    height: 100%;
  }

  .aside {
    height: 100vh;

    background: $unnnic-color-background-grass;
  }
  .template-message-button {
    margin-top: $unnnic-spacing-stack-sm;
  }
}
</style>
