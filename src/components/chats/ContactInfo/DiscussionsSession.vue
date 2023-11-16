<template>
  <aside-slot-template-section
    v-if="discussionsCloseds?.length > 0"
    class="contact-info__discussions"
  >
    <h2 class="contact-info__discussions__title">{{ $tc('discussions.title', 2) }}</h2>
    <ul class="contact-info__discussions__list">
      <li v-for="discussionClosed in discussionsCloseds" :key="discussionClosed.uuid">
        <button
          class="contact-info__discussions__list-item"
          @click="openDiscussionClosed(discussionClosed.uuid)"
        >
          {{ getDiscussionStartedBy(discussionClosed) }}
        </button>
      </li>
    </ul>

    <unnnic-modal
      v-if="showDiscussionClosedModal"
      :text="$t('discussions.history')"
      @close="handleDiscussionClosedModal"
    >
      <discussion-messages />
    </unnnic-modal>
  </aside-slot-template-section>
</template>
<script>
import moment from 'moment';
import { mapState } from 'vuex';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import DiscussionMessages from '../chat/DiscussionMessages';

export default {
  name: 'DiscussionsSession',
  components: {
    AsideSlotTemplateSection,
    DiscussionMessages,
  },
  data() {
    return {
      showDiscussionClosedModal: false,
    };
  },
  async created() {
    try {
      const { room } = this;
      await this.$store.dispatch('chats/discussions/getAllClosed', { roomId: room?.uuid });
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
    async openDiscussionClosed(discussionUuid) {
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', { uuid: discussionUuid });
      this.handleDiscussionClosedModal();
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
      text-align: start;

      cursor: pointer;
    }
  }

  :deep(.unnnic-modal) {
    .unnnic-modal-container-background {
      width: 66%; // -> 8 / 12
      height: 80%;

      display: grid;

      &-body-description-container {
        padding: $unnnic-spacing-md;
        padding-top: 0;
      }
    }
  }
}
</style>
