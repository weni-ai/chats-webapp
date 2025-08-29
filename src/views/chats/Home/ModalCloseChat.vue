<template>
  <UnnnicModalDialog
    :modelValue="modelValue"
    :class="{ 'modal-close-chat--mobile': isMobile, 'modal-close-chat': true }"
    :showCloseIcon="!isMobile"
    :title="$t('chats.to_end_rate_the_chat')"
    :primaryButtonProps="{ text: $t('end_chat'), loading: isLoadingCloseRoom }"
    :secondaryButtonProps="{ text: $t('cancel') }"
    size="lg"
    data-testid="chat-classifier-modal"
    @primary-button-click="closeRoom()"
    @secondary-button-click="closeModal()"
    @update:model-value="closeModal()"
  >
    <ChatClassifier
      v-model="tags"
      :tags="sectorTags"
      :loading="isLoadingTags"
    />
  </UnnnicModalDialog>
</template>

<script>
import isMobile from 'is-mobile';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

import ChatClassifier from '@/components/chats/ChatClassifier.vue';

import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import feedbackService from '@/services/api/resources/chats/feedback';
import { useFeatureFlag } from '@/store/modules/featureFlag';

export default {
  components: {
    ChatClassifier,
  },

  props: {
    room: {
      type: Object,
      required: true,
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close', 'create-feedback'],

  data() {
    return {
      tags: [],
      sectorTags: [],
      page: 0,
      limit: 20,
      isLoadingTags: true,
      isLoadingCloseRoom: false,
      isShowFeedback: false,
    };
  },

  computed: {
    ...mapState(useFeatureFlag, {
      isRenderFeedbackFeatureFlag: (store) =>
        store.featureFlags?.active_features?.includes('weniChatsFeedback'),
    }),
    isMobile() {
      return isMobile();
    },
  },
  mounted() {
    this.classifyRoom();
    this.checkIsShowFeedback();
  },

  methods: {
    ...mapActions(useRooms, ['removeRoom']),
    async classifyRoom() {
      this.isLoadingTags = true;
      let hasNext = false;
      try {
        const response = await Queue.tags(
          this.room.queue.uuid,
          this.page * 20,
          20,
        );
        this.page += 1;
        this.sectorTags = this.sectorTags.concat(response.results);
        hasNext = response.next;
        this.isLoadingTags = false;
      } finally {
        this.isLoadingTags = false;
      }
      if (hasNext) {
        this.classifyRoom();
      }
    },
    async closeRoom() {
      this.isLoadingCloseRoom = true;
      const { uuid } = this.room;

      const tags = this.tags.map((tag) => tag.uuid);
      await Room.close(uuid, tags);

      this.removeRoom(uuid);

      this.isLoadingCloseRoom = false;

      if (this.isShowFeedback && this.isRenderFeedbackFeatureFlag) {
        this.$emit('create-feedback');
      }

      this.closeModal();
    },
    async checkIsShowFeedback() {
      try {
        const response = await feedbackService.getIsShowFeedback();
        this.isShowFeedback = response.should_show_feedback_form;
      } catch (error) {
        console.error('Error checking is show feedback', error);
      }
    },
    closeModal() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-close-chat {
  &--mobile {
    :deep(.unnnic-modal-dialog__container) {
      width: 100%;
    }
  }

  &__tags-list {
    margin-top: $unnnic-spacing-md;

    display: flex;
    gap: $unnnic-spacing-xs;
    overflow: hidden auto;
    flex-wrap: wrap;

    max-height: $unnnic-spacing-xgiant;

    scroll-snap-type: y proximity;
  }
}
</style>
