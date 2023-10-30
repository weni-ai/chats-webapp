<template>
  <aside-slot-template
    :title="
      isOwnDiscussion ? $t('discussions.about.title') : $t('chats.closed_chats.contact_history')
    "
    :icon="isOwnDiscussion ? 'information-circle-4' : 'synchronize-arrow-clock-4'"
    @close="$emit('close')"
  >
    <discussion-about v-if="isOwnDiscussion" :details="details" />
    <discussion-contact-history v-else :details="details" />
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
};
</script>
