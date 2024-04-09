<template>
  <MobileChat
    v-if="showActiveChat"
    @transferred-contact="handleChatTransfer"
  />
  <div
    class="mobile-home"
    v-else
  >
    <!-- callUnnnicAlert is using the class of this element below as containerRef -->
    <main class="mobile-home__main">
      <MobileClosedChats
        v-if="showHistory"
        @close="openTabChats"
      />

      <FlowsTrigger
        v-else-if="showFlowsTrigger"
        :selectedContact="null"
        @close="openTabChats"
      />

      <UnnnicChatsHeader
        v-else-if="showChats"
        title="Chats"
        :subtitle="projectName"
        avatarIcon="forum"
        :back="homeBack"
        sectionIconScheme="weni-600"
      />
      <section
        class="mobile-home__tab__chats"
        v-if="showChats"
      >
        <TheCardGroups class="mobile-home__chats-list" />
      </section>

      <QuickMessages
        v-else-if="showQuickMessages"
        ref="quickMessages"
        @close="closeQuickMessages"
        @select-quick-message="closeQuickMessages"
      />
      <ModalPreferences
        v-if="showPreferences"
        @close="returnToOldTab"
        @open-quick-messages="openQuickMessages"
        @back-to-home="homeBack"
      />
    </main>

    <UnnnicChatsNavbar
      v-model="currentTab"
      :links="navs"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';

import TheCardGroups from '@/layouts/ChatsLayout/components/TheCardGroups';
import FlowsTrigger from '@/layouts/ChatsLayout/components/FlowsTrigger';

import MobileChat from '@/views/chats/Mobile/MobileChat';
import MobileClosedChats from '@/views/chats/Mobile/MobileClosedChats';

import ModalPreferences from '@/components/chats/Mobile/ModalPreferences.vue';
import QuickMessages from '@/components/chats/QuickMessages';

import callUnnnicAlert from '@/utils/callUnnnicAlert';
import { resetChats } from '@/utils/chats';

export default {
  name: 'MobileHome',

  components: {
    TheCardGroups,
    FlowsTrigger,
    MobileClosedChats,
    ModalPreferences,
    QuickMessages,
    MobileChat,
  },

  data() {
    return {
      currentTab: 'chats',
      oldTab: '',
      isOpenedQuickMessages: false,

      isCallingTransferAlert: false,
    };
  },

  computed: {
    ...mapState({
      projectName: (state) => state.config.project.name,
      room: (state) => state.chats.rooms.activeRoom,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),

    navs() {
      return [
        {
          name: 'history',
          icon: 'history',
          action: () => this.openHistory(),
        },
        {
          name: 'flows_trigger',
          icon: 'send',
          action: () => this.openTabFlowsTrigger(),
        },
        {
          name: 'chats',
          icon: 'forum',
          action: () => this.openTabChats(),
        },
        {
          name: 'preferences',
          icon: 'preferences',
          action: () => this.openTabPreferences(),
        },
      ];
    },

    showHistory() {
      const { currentTab, oldTab, showPreferences } = this;
      const tab = 'history';
      return currentTab === tab || (showPreferences && oldTab === tab);
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
    showActiveChat() {
      const { showChats, room, discussion, isCallingTransferAlert } = this;
      return showChats && (room || discussion) && !isCallingTransferAlert;
    },
  },

  methods: {
    homeBack() {
      this.$router.push({ name: 'orgs' });
    },

    updateCurrentTab(tab) {
      const navNames = this.navs.map((nav) => nav.name);
      if (!navNames.includes(tab)) {
        throw new Error(
          `The tab "${tab}" is not a valid tab. Try any of: ${navNames.join(
            ', ',
          )}`,
        );
      }

      this.currentTab = tab;
    },

    openHistory() {
      this.updateCurrentTab('history');
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

    handleChatTransfer() {
      this.callTransferChatAlert();
    },

    async callTransferChatAlert() {
      /*
         "isCallingTransferAlert" is the condition used to mount
         mobile-home__main and "$nextTick" is necessary to ensure that the
         alert has the element "mobile-home__main" mounted as container and
         do not overlap it.
      */
      this.isCallingTransferAlert = true;

      await this.$nextTick();
      callUnnnicAlert({
        props: {
          text: this.$t('contact_transferred_with_success'),
          type: 'success',
        },
        seconds: 5,
      });

      /*
        "$nextTick" was not used here because more than one update to the
        DOM is made for callUnnnicAlert to be called. setTimeout gives time
        for the alert to be mounted and thus sets isCallingTransferAlert to false.
      */
      setTimeout(() => {
        this.isCallingTransferAlert = false;
      }, 400);
    },
  },

  watch: {
    $route: {
      immediate: true,
      async handler(newRoute) {
        if (
          (!this.room?.uuid && !this.discussion?.uuid) ||
          newRoute.name === 'home'
        ) {
          resetChats();
        }

        if (newRoute.query.newQuickMessage) {
          await this.openTabPreferences();
          await this.openQuickMessages();
          await this.$refs.quickMessages?.openQuickMessageCreation();
        }
      },
    },
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
.mobile-home {
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
