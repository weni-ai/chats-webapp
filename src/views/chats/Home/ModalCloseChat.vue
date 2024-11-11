<template>
  <UnnnicModalDialog
    :modelValue="modelValue"
    :class="{ 'modal-close-chat--mobile': isMobile, 'modal-close-chat': true }"
    :showCloseIcon="!isMobile"
    :title="$t('chats.to_end_rate_the_chat')"
    :primaryButtonProps="{ text: $t('end'), loading: isLoadingCloseRoom }"
    data-testid="chat-classifier-modal"
    @primary-button-click="closeRoom()"
    @secondary-button-click="closeModal()"
    @close="closeModal()"
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

import { mapActions } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

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
    };
  },

  computed: {
    isMobile() {
      return isMobile();
    },
  },
  mounted() {
    this.classifyRoom();
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
        // this.sectorTags = response.results;
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
