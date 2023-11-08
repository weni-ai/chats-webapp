<template>
  <aside-slot-template
    class="discussion-sidebar"
    :title="
      isOwnDiscussion ? $t('discussions.about.title') : $t('chats.closed_chats.contact_history')
    "
    :icon="isOwnDiscussion ? 'chat_info' : 'history'"
    iconScheme="neutral-dark"
    @close="handleEndDiscussionModal"
  >
    <discussion-about v-if="isOwnDiscussion" :details="details" />
    <room-messages v-else />

    <unnnic-modal
      v-if="isEndDiscussionModalOpen"
      @close="handleEndDiscussionModal"
      :text="$t('discussions.close.title')"
      :description="$t('discussions.close.description')"
      modalIcon="alert-circle-1"
      scheme="feedback-yellow"
    >
      <template #options>
        <unnnic-button :text="$t('cancel')" type="tertiary" @click="handleEndDiscussionModal" />
        <unnnic-button :text="$t('end')" type="primary" @click="endDiscussion" />
      </template>
    </unnnic-modal>
  </aside-slot-template>
</template>

<script>
import { mapState } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionAbout from './DiscussionAbout';

export default {
  name: 'DiscussionSidebar',

  components: {
    AsideSlotTemplate,
    DiscussionAbout,
    RoomMessages,
  },

  data: () => {
    return {
      details: null,
      isOwnDiscussion: false,

      isEndDiscussionModalOpen: false,
    };
  },

  async created() {
    this.details = await this.$store.dispatch('chats/discussions/getDiscussionDetails');
    this.isOwnDiscussion = this.me.email === this.discussion.created_by?.email || true;
    // TODO: Remove "|| true" when the backend returns the email of the user who created the discussion
  },

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),
  },

  methods: {
    handleEndDiscussionModal() {
      this.isEndDiscussionModalOpen = !this.isEndDiscussionModalOpen;
    },

    async endDiscussion() {
      await this.$store.dispatch('chats/discussions/delete');
      this.handleEndDiscussionModal();
    },
  },
};
</script>

<style lang="scss" scoped>
.discussion-sidebar {
  .chat-messages {
    padding: 0 $unnnic-spacing-xs;
  }
  :deep(.unnnic-modal-container-background-button) {
    padding-top: 0;
  }
}
</style>
