<template>
  <section
    v-if="discussionsCloseds?.length > 0"
    v-resize-observer="handleResize"
    class="contact-info__discussions"
    :class="{ 'contact-info__discussions--mobile': isMobileFlag }"
  >
    <ul
      class="contact-info__discussions__list"
      data-testid="contact-info-discussion-list"
    >
      <li
        v-for="discussionClosed in discussionsCloseds"
        :key="discussionClosed.uuid"
        class="contact-info__discussions__list-item"
      >
        <p>{{ $t('discussions.title') }}:</p>
        <button
          class="contact-info__discussions__list-item-link"
          data-testid="contact-info-discussion-list-item"
          @click="openDiscussionClosed(discussionClosed.uuid)"
        >
          {{ getDiscussionStartedBy(discussionClosed) }}
        </button>
      </li>
    </ul>

    <UnnnicDialog
      v-model:open="showDiscussionClosedModal"
      class="contact-info__discussions-dialog"
    >
      <UnnnicDialogContent size="large">
        <UnnnicDialogHeader>
          <UnnnicDialogTitle>
            {{ $t('discussions.history') }}
          </UnnnicDialogTitle>
        </UnnnicDialogHeader>
        <section class="contact-info__discussions-dialog__body">
          <DiscussionMessages />
        </section>
      </UnnnicDialogContent>
    </UnnnicDialog>
  </section>
</template>
<script>
import isMobile from 'is-mobile';
import moment from 'moment';

import { mapState, mapActions } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import DiscussionMessages from '../chat/DiscussionMessages.vue';
import { vResizeObserver } from '@vueuse/components';

export default {
  name: 'DiscussionsSession',
  components: {
    DiscussionMessages,
  },
  directives: {
    resizeObserver: vResizeObserver,
  },
  data() {
    return {
      isMobileFlag: isMobile(),
      discussionLinkWidth: '100%',
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
    handleResize(entries) {
      this.discussionLinkWidth = `${entries[0].contentRect.width - 71}px`;
    },
  },
};
</script>

<style lang="scss" scoped>
.contact-info__discussions {
  display: grid;

  &__title {
    color: $unnnic-color-fg-base;
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-bold;
  }

  &__list {
    display: grid;
    gap: $unnnic-spacing-xs;

    &-item {
      display: flex;
      align-items: baseline;
      gap: $unnnic-space-05;
      font: $unnnic-font-action;
      color: $unnnic-color-fg-base;

      &-link {
        font: $unnnic-font-body;
        border: none;
        background-color: transparent;
        color: $unnnic-color-fg-base;
        text-decoration-line: underline;
        cursor: pointer;
        text-align: left;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: v-bind(discussionLinkWidth);
      }
    }
  }

  &-dialog {
    &__body {
      display: grid;
      grid-template-rows: 1fr;
      padding: $unnnic-spacing-md;
      padding-top: 0;
      text-align: start;
      min-height: 0;
      overflow: auto;
    }
  }
}

.contact-info__discussions--mobile {
  :deep(.contact-info__discussions-dialog) {
    [data-unnnic-dialog-content] {
      width: 100%;
      max-height: 90%;
    }
  }
}
</style>
