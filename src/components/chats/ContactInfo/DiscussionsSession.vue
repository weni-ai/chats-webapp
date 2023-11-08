<template>
  <aside-slot-template-section
    v-if="discussionsCloseds?.length > 0"
    class="contact-info__discussions"
  >
    <h2 class="contact-info__discussions__title">{{ $tc('discussions.title', 2) }}</h2>
    <ul class="contact-info__discussions__list">
      <li v-for="discussionClosed in discussionsCloseds" :key="discussionClosed.uuid">
        <button class="contact-info__discussions__list-item" @click="handleDiscussionClosedModal">
          {{ getDiscussionStartedBy(discussionClosed) }}
        </button>
      </li>
    </ul>

    <unnnic-modal
      v-if="showDiscussionClosedModal"
      :text="$t('discussions.start_discussion.title')"
      @close="handleDiscussionClosedModal"
    >
    </unnnic-modal>
  </aside-slot-template-section>
</template>
<script>
import moment from 'moment';
import { mapState } from 'vuex';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';

export default {
  name: 'DiscussionsSession',
  components: {
    AsideSlotTemplateSection,
  },
  data() {
    return {
      showDiscussionClosedModal: false,
    };
  },
  async created() {
    try {
      const { room } = this;
      await this.$store.dispatch('chats/discussions/getAllClosed', { room });
    } catch (error) {
      console.error('Error listing closed discussions', error);
    }
  },
  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      discussionsCloseds: (state) => state.chats.discussions.discussionsCloseds,
    }),
  },
  methods: {
    getDiscussionStartedBy(discussion) {
      return `${moment(discussion.created_on).format('L')} | ${this.$t('discussions.started_by', {
        name: discussion.created_by,
      })}`;
    },
    handleDiscussionClosedModal() {
      this.showDiscussionClosedModal = !this.showDiscussionClosedModal;
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-info__discussions {
  display: grid;
  gap: $unnnic-spacing-sm;

  &__title {
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-bold;
  }
  &__list {
    display: grid;
    gap: $unnnic-spacing-xs;

    &-item {
      border: none;
      background-color: transparent;

      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-bold;
      text-decoration-line: underline;
      font-family: $unnnic-font-family-secondary;

      cursor: pointer;
    }
  }
}
</style>
