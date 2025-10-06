<template>
  <UnnnicModalDialog
    :modelValue="modelValue"
    :class="{ 'modal-close-chat--mobile': isMobile, 'modal-close-chat': true }"
    :showCloseIcon="!isMobile"
    :title="$t('chats.to_end_rate_the_chat')"
    :primaryButtonProps="{
      text: $t('end_chat'),
      loading: isLoadingCloseRoom,
      disabled: isInvalidRequiredTags,
    }"
    :secondaryButtonProps="{ text: $t('cancel') }"
    size="lg"
    data-testid="chat-classifier-modal"
    @primary-button-click="closeRoom()"
    @secondary-button-click="closeModal()"
    @update:model-value="closeModal()"
  >
    <section class="modal-close-chat__content">
      <UnnnicDisclaimer
        v-if="isInvalidRequiredTags"
        class="modal-close-chat__disclaimer"
        iconColor="feedback-yellow"
        :text="$t('chats.to_end_rate_the_chat')"
      />
      <ChatClassifier
        v-model="tags"
        :tags="sectorTags"
        :loading="isLoadingTags"
      />
    </section>
  </UnnnicModalDialog>
</template>

<script>
import isMobile from 'is-mobile';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

import ChatClassifier from '@/components/chats/ChatClassifier.vue';

import { mapActions } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import feedbackService from '@/services/api/resources/chats/feedback';
import { useFeedback } from '@/store/modules/feedback';

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
  emits: ['close'],

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
    isMobile() {
      return isMobile();
    },
    isInvalidRequiredTags() {
      return this.room.queue?.required_tags && this.tags.length === 0;
    },
  },
  mounted() {
    this.classifyRoom();
    this.checkIsShowFeedback();
  },

  methods: {
    ...mapActions(useFeedback, ['setIsRenderFeedbackModal']),
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

      this.closeModal();

      if (this.isShowFeedback) {
        this.setIsRenderFeedbackModal(true);
      }
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
  :deep(.modal-close-chat__disclaimer) {
    display: flex;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }

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
