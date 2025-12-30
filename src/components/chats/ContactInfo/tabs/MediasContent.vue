<template>
  <section
    ref="scrollContainer"
    class="medias__container"
    data-testid="medias-container"
  >
    <section
      v-if="hasMedias || isLoadingMedias"
      class="medias__content"
      data-testid="medias-content"
    >
      <MediaPreview
        v-for="(media, index) in images"
        :key="media.created_on + index"
        :src="media.url"
        :isVideo="media.content_type.startsWith('video/')"
        data-testid="media-preview"
        @click="$emit('fullscreen', media.url, images)"
      />

      <template v-if="isLoadingMedias">
        <UnnnicSkeletonLoading
          v-for="skeleton in 4"
          :key="`skeleton-${skeleton}`"
          class="medias__content--loading-key"
        />
      </template>
    </section>
    <section
      v-else
      class="medias__empty"
      data-testid="medias-empty"
    >
      <p>{{ $t('no_media_found') }}</p>
    </section>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useInfiniteScroll } from '@vueuse/core';
import MediaPreview from '@/components/chats/MediaMessage/Previews/Media.vue';
import { useContactInfos } from '@/store/modules/chats/contactInfos';

const props = defineProps({
  room: {
    type: Object,
    default: () => {},
  },
  contactInfo: {
    type: Object,
    default: () => {},
  },
  history: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['fullscreen']);

const scrollContainer = ref(null);
const contactInfosStore = useContactInfos();
const { images, hasMedias, isLoadingMedias, hasMoreMedias } =
  storeToRefs(contactInfosStore);

const loadMoreMedias = async () => {
  if (!hasMoreMedias.value || isLoadingMedias.value) return;

  if (!props.history) {
    await contactInfosStore.loadNextMedias({
      contact: props.room?.contact?.uuid,
      room: props.room?.uuid,
    });
  } else {
    await contactInfosStore.loadNextMediasClosedRoom({
      contactInfo: props.contactInfo?.uuid,
    });
  }
};

useInfiniteScroll(scrollContainer, loadMoreMedias, {
  distance: 10,
  canLoadMore: () => hasMoreMedias.value && !isLoadingMedias.value,
});

onMounted(async () => {
  if (!hasMedias.value && !isLoadingMedias.value) {
    await contactInfosStore.loadMedias({
      contact: props.room?.contact?.uuid,
      room: props.room?.uuid,
      history: props.history,
      contactInfo: props.contactInfo?.uuid,
    });
  }
});
</script>

<style lang="scss" scoped>
.medias__container {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: $unnnic-spacing-xs;
}

.medias__content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: $unnnic-spacing-xs;

  &--loading-key {
    width: 68px;
    height: 68px;
  }
}

.medias__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $unnnic-spacing-md;
  color: $unnnic-color-neutral-cloudy;
}
</style>
