<template>
  <div class="discussion-sidebar__container">
    <discussion-sidebar-loading v-show="isSidebarLoading" />
    <aside-slot-template
      class="discussion-sidebar"
      v-show="!isSidebarLoading"
      :title="
        isOwnDiscussion ? $t('discussions.about.title') : $t('chats.closed_chats.contact_history')
      "
      :icon="isOwnDiscussion ? 'chat_info' : 'history'"
      iconScheme="neutral-dark"
      :close="isOwnDiscussion ? handleEndDiscussionModal : null"
    >
      <discussion-about v-if="isOwnDiscussion" :details="details" />
      <room-messages v-else />

      <unnnic-modal
        v-if="isEndDiscussionModalOpen"
        @close="handleEndDiscussionModal"
        :text="$t('discussions.close.title')"
        :description="$t('discussions.close.description')"
        modalIcon="error"
        scheme="feedback-yellow"
        class="discussion-sidebar__end-modal"
      >
        <template #options>
          <unnnic-button :text="$t('cancel')" type="tertiary" @click="handleEndDiscussionModal" />
          <unnnic-button
            :text="$t('end')"
            type="primary"
            @click="endDiscussion"
            :loading="isEndDiscussionLoading"
          />
        </template>
      </unnnic-modal>
    </aside-slot-template>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import DiscussionSidebarLoading from '@/views/loadings/chat/DiscussionSidebar';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionAbout from './DiscussionAbout';

export default {
  name: 'DiscussionSidebar',

  components: {
    DiscussionSidebarLoading,
    AsideSlotTemplate,
    DiscussionAbout,
    RoomMessages,
  },

  data: () => {
    return {
      isSidebarLoading: true,

      details: null,
      isOwnDiscussion: false,

      isEndDiscussionModalOpen: false,
      isEndDiscussionLoading: false,
    };
  },

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),
  },

  methods: {
    async loadDiscussionDetails() {
      this.isSidebarLoading = true;

      this.details = await this.$store.dispatch('chats/discussions/getDiscussionDetails');
      this.isOwnDiscussion = this.me.email === this.details.created_by?.email;
      await this.$store.dispatch('chats/rooms/setActiveRoom', {
        uuid: this.details.room,
        contact: { name: this.details.contact },
      });
      this.isSidebarLoading = false;
    },
    handleEndDiscussionModal() {
      this.isEndDiscussionModalOpen = !this.isEndDiscussionModalOpen;
    },

    async endDiscussion() {
      this.isEndDiscussionLoading = true;
      await this.$store.dispatch('chats/rooms/setActiveRoom', null);
      await this.$store.dispatch('chats/discussions/delete');
      this.handleEndDiscussionModal();
    },
  },

  watch: {
    discussion: {
      immediate: true,
      async handler() {
        await this.loadDiscussionDetails();
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.discussion-sidebar__container {
  height: 100%;

  overflow: hidden;
}

.discussion-sidebar {
  .chat-messages {
    padding: 0 $unnnic-spacing-xs;
  }

  &__end-modal {
    :deep(.unnnic-modal-container-background-button) {
      padding-top: 0;
    }
  }
}
</style>
