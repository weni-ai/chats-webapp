<template>
  <AsideSlotTemplateSection
    v-if="discussionsCloseds?.length > 0"
    class="contact-info__discussions"
    :class="{ 'contact-info__discussions--mobile': isMobileFlag }"
  >
    <h2
      class="contact-info__discussions__title"
      data-testid="contact-info-discussion-title"
    >
      {{ $tc('discussions.title', 2) }}
    </h2>
    <ul
      class="contact-info__discussions__list"
      data-testid="contact-info-discussion-list"
    >
      <li
        v-for="discussionClosed in discussionsCloseds"
        :key="discussionClosed.uuid"
      >
        <button
          class="contact-info__discussions__list-item"
          data-testid="contact-info-discussion-list-item"
          @click="openDiscussionClosed(discussionClosed.uuid)"
        >
          {{ getDiscussionStartedBy(discussionClosed) }}
        </button>
      </li>
    </ul>

    <UnnnicModal
      v-if="showDiscussionClosedModal"
      :text="$t('discussions.history')"
      @close="handleDiscussionClosedModal"
    >
      <DiscussionMessages />
    </UnnnicModal>
  </AsideSlotTemplateSection>
</template>
<script>
import isMobile from 'is-mobile';
import moment from 'moment';

import { mapState, mapActions } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import DiscussionMessages from '../chat/DiscussionMessages.vue';

export default {
  name: 'DiscussionsSession',
  components: {
    AsideSlotTemplateSection,
    DiscussionMessages,
  },
  data() {
    return {
      isMobileFlag: isMobile(),

      showDiscussionClosedModal: false,
    };
  },
  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useDiscussions, ['discussionsCloseds']),
  },
  watch: {
    showDiscussionClosedModal(newShowDiscussionClosedModal) {
      if (!newShowDiscussionClosedModal) {
        this.setActiveDiscussion(null);
      }
    },
  },
  async created() {
    try {
      const { room } = this;
      await this.getAllClosed({
        roomId: room?.uuid,
      });
    } catch (error) {
      console.error('Error listing closed discussions', error);
    }
  },
  methods: {
    ...mapActions(useDiscussions, ['setActiveDiscussion', 'getAllClosed']),
    getDiscussionStartedBy(discussion) {
      return `${moment(discussion.created_on).format('L')} | ${this.$t(
        'discussions.started_by',
        {
          name: discussion.created_by,
        },
      )}`;
    },
    async openDiscussionClosed(discussionUuid) {
      await this.setActiveDiscussion({
        uuid: discussionUuid,
      });
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

  :deep(.unnnic-modal) .unnnic-modal-container-background {
    width: 66%; // -> 8 / 12
    height: 80%;

    display: grid;
    grid-template-rows: auto 1fr;

    &-body-description {
      text-align: start;

      &-container {
        padding: $unnnic-spacing-md;
        padding-top: 0;
      }
    }
  }
}

.contact-info__discussions--mobile {
  :deep(.unnnic-modal) .unnnic-modal-container-background {
    width: 100%;
    height: 90%;
  }
}
</style>
