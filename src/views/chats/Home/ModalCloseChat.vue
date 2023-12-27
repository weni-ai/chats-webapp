<template>
  <unnnic-modal
    @close="closeModal"
    :text="$t('chats.to_end_rate_the_chat')"
    :description="$t('chats.tags_help')"
    scheme="neutral-darkest"
    class="modal-close-chat"
  >
    <div class="modal-close-chat__tags-list">
      <chat-classifier v-model="tags" :tags="sectorTags" :loading="isLoadingTags">
      </chat-classifier>
    </div>

    <template #options>
      <unnnic-button :text="$t('cancel')" type="secondary" @click="closeModal" />
      <unnnic-button
        :text="$t('end')"
        type="primary"
        @click="closeRoom"
        :loading="isLoadingCloseRoom"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import ChatClassifier from '@/components/chats/ChatClassifier';
import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

export default {
  components: {
    ChatClassifier,
  },

  props: {
    room: {
      type: Object,
      default: () => {},
    },
  },

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
  mounted() {
    this.classifyRoom();
  },

  methods: {
    async classifyRoom() {
      this.isLoadingTags = true;
      let hasNext = false;
      try {
        const response = await Queue.tags(this.room.queue.uuid, this.page * 20, 20);
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
      this.$store.dispatch('chats/rooms/removeRoom', uuid);

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