<template>
  <UnnnicModal
    class="modal-close-chat"
    :class="{ 'modal-close-chat--mobile': isMobile }"
    scheme="neutral-darkest"
    :text="$t('chats.to_end_rate_the_chat')"
    :description="$t('chats.tags_help')"
    :closeIcon="isMobile"
    @close="closeModal"
  >
    <section class="modal-close-chat__tags-list">
      <ChatClassifier
        v-model="tags"
        :tags="sectorTags"
        :loading="isLoadingTags"
      />
    </section>

    <template #options>
      <UnnnicButton
        :text="$t('cancel')"
        type="tertiary"
        @click="closeModal"
      />
      <UnnnicButton
        :text="$t('end')"
        type="primary"
        @click="closeRoom"
        :loading="isLoadingCloseRoom"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import isMobile from 'is-mobile';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

import ChatClassifier from '@/components/chats/ChatClassifier.vue';

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

  computed: {
    isMobile() {
      return isMobile();
    },
  },

  methods: {
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
  /*
     These "deep" properties and their following code are being applied temporarily while
     the unnnic modal does not undergo refactoring. They adjust the style of the modal
     and its parts to ensure a consistent experience during this transition period.
   */
  :deep(.unnnic-modal-container) .unnnic-modal-container-background-body {
    &-title {
      padding: $unnnic-spacing-nano;
    }

    &-description {
      padding: 0;

      &-container {
        padding-bottom: 0;
      }
    }
  }

  &--mobile {
    :deep(.unnnic-modal-container) .unnnic-modal-container-background {
      &-body {
        padding: $unnnic-spacing-sm;

        &-description-container {
          padding: 0 $unnnic-spacing-sm;
        }
      }
      &-button {
        padding: $unnnic-spacing-md $unnnic-spacing-sm;

        :first-child {
          margin-right: $unnnic-spacing-xs;
        }
      }
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
