<template>
  <aside-slot-template
    :title="
      isOwnDiscussion ? $t('discussions.about.title') : $t('chats.closed_chats.contact_history')
    "
    :icon="isOwnDiscussion ? 'chat_info' : 'synchronize-arrow-clock-4'"
    @close="handleEndDiscussionModal"
  >
    <discussion-about v-if="isOwnDiscussion" :details="details" />
    <discussion-contact-history v-else :details="details" />

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
import DiscussionAbout from './DiscussionAbout';
import DiscussionContactHistory from './DiscussionContactHistory';

export default {
  name: 'DiscussionSidebar',

  components: {
    AsideSlotTemplate,
    DiscussionAbout,
    DiscussionContactHistory,
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
    this.isOwnDiscussion = this.me.email === this.discussion.created_by.email || true;
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
:deep(.unnnic-modal-container-background-button) {
  padding-top: 0;
}
</style>
