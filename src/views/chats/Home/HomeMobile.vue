<template>
  <div class="home-mobile" v-if="!room && !discussion">
    <section class="home-mobile__tab__chats" v-if="showChats">
      <unnnic-chats-header
        title="Chats"
        subtitle="Nome do projeto"
        avatarIcon="forum"
        :back="() => {}"
        sectionIconScheme="weni-600"
      />
      <main class="home-mobile__main">
        <the-card-groups class="home-mobile__chats-list" />
      </main>
    </section>
    <flows-trigger v-else :selectedContact="null" @close="openTabChats" />
    <unnnic-chats-navbar :links="navs" :initialLink="currentTab" />
  </div>
  <mobile-chat v-else />
</template>

<script>
import { mapState } from 'vuex';

import TheCardGroups from '@/layouts/ChatsLayout/components/TheCardGroups';
import FlowsTrigger from '@/layouts/ChatsLayout/components/FlowsTrigger';

import MobileChat from '@/views/chats/Mobile/MobileChat';

export default {
  name: 'HomeMobile',

  components: {
    TheCardGroups,
    FlowsTrigger,
    MobileChat,
  },

  data() {
    return {
      currentTab: 'chats',
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
          action: () => {},
        },
      ];
    },

    showChats() {
      return this.currentTab === 'chats';
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

    openTabChats() {
      this.updateCurrentTab('chats');
    },

    openTabFlowsTrigger() {
      this.updateCurrentTab('flows_trigger');
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
