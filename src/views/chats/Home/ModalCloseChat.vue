<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('chats.to_end_rate_the_chat') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-close-chat__content">
        <UnnnicDisclaimer
          v-if="isInvalidRequiredTags && !isLoadingTags"
          class="modal-close-chat__disclaimer"
          type="attention"
          :description="$t('chats.to_end_required_tags')"
        />
        <UnnnicInput
          v-model="tagsFilter"
          iconLeft="search"
          :placeholder="$t('tags.search')"
        />
        <section class="modal-close-chat__tags-list">
          <ChatClassifier
            v-model="tags"
            :tags="filteredTags"
            :loading="isLoadingTags"
            @update:to-remove-tags="(tags) => (toRemoveTags = tags)"
            @update:to-add-tags="(tags) => (toAddTags = tags)"
          />
        </section>
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="isLoadingCloseRoom"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          data-testid="close-chat-button"
          :text="$t('end_chat')"
          type="primary"
          :loading="isLoadingCloseRoom"
          :disabled="isInvalidRequiredTags"
          @click="closeRoom()"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
  <!-- TODO: Check Mobile version -->
  <!-- <UnnnicModalDialog
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
        v-if="isInvalidRequiredTags && !isLoadingTags"
        class="modal-close-chat__disclaimer"
        type="attention"
        :description="$t('chats.to_end_required_tags')"
      />
      <UnnnicInput
        v-model="tagsFilter"
        iconLeft="search"
        :placeholder="$t('tags.search')"
      />
      <section class="modal-close-chat__tags-list">
        <ChatClassifier
          v-model="tags"
          :tags="filteredTags"
          :loading="isLoadingTags"
          @update:to-remove-tags="(tags) => (toRemoveTags = tags)"
          @update:to-add-tags="(tags) => (toAddTags = tags)"
        />
      </section>
    </section>
  </UnnnicModalDialog> -->
</template>

<script>
import { mapActions } from 'pinia';
import isMobile from 'is-mobile';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

import ChatClassifier from '@/components/chats/ChatClassifier.vue';

import { useRooms } from '@/store/modules/chats/rooms';
import { useFeedback } from '@/store/modules/feedback';

import feedbackService from '@/services/api/resources/chats/feedback';

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
  emits: ['close', 'update:modelValue'],

  data() {
    return {
      tags: [],
      tagsNext: '',
      sectorTags: [],
      page: 0,
      limit: 20,
      isLoadingTags: true,
      isLoadingCloseRoom: false,
      isShowFeedback: false,
      toRemoveTags: [],
      toAddTags: [],
      tagsFilter: '',
    };
  },

  computed: {
    isMobile() {
      return isMobile();
    },
    isInvalidRequiredTags() {
      return this.room.queue?.required_tags && this.tags.length === 0;
    },
    filteredTags() {
      return this.sectorTags.filter((tag) =>
        tag.name.toLowerCase().includes(this.tagsFilter.toLowerCase()),
      );
    },
    open: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
  mounted() {
    this.classifyRoom();
    this.checkIsShowFeedback();
    this.loadRoomTags();
  },

  methods: {
    ...mapActions(useFeedback, ['setIsRenderFeedbackModal']),
    ...mapActions(useRooms, ['removeRoom']),
    async loadRoomTags() {
      try {
        const roomUuid = this.room.uuid;
        const { results, next } = await Room.getRoomTags(roomUuid, {
          next: this.tagsNext,
          limit: 20,
        });
        this.tagsNext = next;
        this.tags = this.tags.concat(results);
      } catch (error) {
        console.error('Error loading room tags', error);
      } finally {
        if (this.tagsNext) this.loadRoomTags();
      }
    },
    async classifyRoom() {
      this.isLoadingTags = true;

      try {
        const response = await Queue.tags(this.room.queue.uuid, {
          limit: 20,
          next: this.tagsNext,
        });
        this.sectorTags = this.sectorTags.concat(response.results);
        this.tagsNext = response.next;
      } catch (error) {
        console.error('Error classifying room', error);
      } finally {
        if (this.tagsNext) this.classifyRoom();
        else this.isLoadingTags = false;
      }
    },
    async closeRoom() {
      this.isLoadingCloseRoom = true;
      const { uuid } = this.room;

      if (this.toRemoveTags.length > 0) {
        const requests = this.toRemoveTags.map((tag) =>
          Room.removeRoomTag(uuid, tag),
        );
        await Promise.all(requests);
      }

      if (this.toAddTags.length > 0) {
        const requests = this.toAddTags.map((tag) =>
          Room.addRoomTag(uuid, tag),
        );
        await Promise.all(requests);
      }

      await Room.close(uuid);

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
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
  }

  &--mobile {
    :deep(.unnnic-modal-dialog__container) {
      width: 100%;
    }
  }

  &__tags-list {
    display: flex;
    gap: $unnnic-space-3;
    overflow: hidden auto;
    flex-wrap: wrap;

    max-height: 500px;

    scroll-snap-type: y proximity;
  }
}
</style>
