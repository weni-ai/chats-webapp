<template>
  <div class="home-mobile" v-if="!room && !discussion">
    <main class="home-mobile__main">
      <unnnic-chats-header
        v-if="showChats"
        title="Chats"
        subtitle="Nome do projeto"
        avatarIcon="forum"
        :back="() => {}"
        sectionIconScheme="weni-600"
      />
      <section class="home-mobile__tab__chats" v-if="showChats">
        <the-card-groups class="home-mobile__chats-list" />
      </section>

      <flows-trigger v-else-if="showFlowsTrigger" :selectedContact="null" @close="openTabChats" />

      <quick-messages
        v-else-if="showQuickMessages"
        @close="closeQuickMessages"
        @select-quick-message="closeQuickMessages"
      />
      <modal-preferences
        v-if="showPreferences"
        @close="returnToOldTab"
        @open-quick-messages="openQuickMessages"
      />
    </main>

    <unnnic-chats-navbar :links="navs" :initialLink="currentTab" />
  </div>
  <mobile-chat v-else />
</template>

<script>
import { mapState } from 'vuex';

import TheCardGroups from '@/layouts/ChatsLayout/components/TheCardGroups';
import FlowsTrigger from '@/layouts/ChatsLayout/components/FlowsTrigger';

import ModalPreferences from '@/components/chats/Mobile/ModalPreferences.vue';
import QuickMessages from '@/components/chats/QuickMessages';

import MobileChat from '@/views/chats/Mobile/MobileChat';

export default {
  name: 'HomeMobile',

  components: {
    TheCardGroups,
    FlowsTrigger,
    ModalPreferences,
    QuickMessages,
    MobileChat,
  },

  data() {
    return {
      currentTab: 'chats',
      oldTab: '',
      isOpenedQuickMessages: false,
    };
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),

    navs() {
      return [
        {
          name: 'history',
          icon: {
            default: 'history',
            selected: 'history',
          },
          action: () => {},
        },
        {
          name: 'flows_trigger',
          icon: {
            default: 'send',
            selected: 'send',
          },
          action: () => this.openTabFlowsTrigger(),
        },
        {
          name: 'chats',
          icon: {
            default: 'forum',
            selected: 'forum',
          },
          action: () => this.openTabChats(),
        },
        {
          name: 'preferences',
          icon: {
            default: 'preferences',
            selected: 'preferences',
          },
          action: () => this.openTabPreferences(),
        },
      ];
    },

    showFlowsTrigger() {
      const { currentTab, oldTab, showPreferences } = this;
      const tab = 'flows_trigger';
      return currentTab === tab || (showPreferences && oldTab === tab);
    },
    showChats() {
      const { currentTab, oldTab, showPreferences } = this;
      const tab = 'chats';
      return currentTab === tab || (showPreferences && oldTab === tab);
    },
    showPreferences() {
      return this.currentTab === 'preferences' && !this.isOpenedQuickMessages;
    },
    showQuickMessages() {
      return this.currentTab === 'preferences' && this.isOpenedQuickMessages;
    },
  },

  methods: {
    updateCurrentTab(tab) {
      const navNames = this.navs.map((nav) => nav.name);
      if (!navNames.includes(tab)) {
        throw new Error(`The tab "${tab}" is not a valid tab. Try any of: ${navNames.join(', ')}`);
      }

      this.currentTab = tab;
    },

    openTabFlowsTrigger() {
      this.updateCurrentTab('flows_trigger');
    },
    openTabChats() {
      this.updateCurrentTab('chats');
    },
    openTabPreferences() {
      this.updateCurrentTab('preferences');
    },

    openQuickMessages() {
      this.isOpenedQuickMessages = true;
    },
    closeQuickMessages() {
      this.isOpenedQuickMessages = false;
    },

    returnToOldTab() {
      this.currentTab = this.oldTab;
    },
  },

  watch: {
    currentTab(newTab, oldTab) {
      this.oldTab = oldTab;

      if (oldTab === 'preferences') {
        this.closeQuickMessages();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.home-mobile {
  overflow: hidden;

  display: grid;
  grid-template-rows: 1fr auto;

  height: 100vh;

  &__main {
    position: relative;

    overflow: hidden;
  }

  &__tab__chats {
    overflow: hidden;

    padding: $unnnic-spacing-xs $unnnic-spacing-sm 0;
  }

  &__chats-list {
    height: 100%;
  }

  :deep(.unnnic-modal) {
    position: absolute;
  }
}
</style>
