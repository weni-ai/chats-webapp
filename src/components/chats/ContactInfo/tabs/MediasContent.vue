<template>
  <section
    v-if="!isLoadingMedias"
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
  </section>
  <section
    v-else
    class="medias__content--loading"
    data-testid="medias-content-loading"
  >
    <UnnnicSkeletonLoading
      v-for="media in 8"
      :key="`media-${media}`"
    />
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
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

const contactInfosStore = useContactInfos();
const { images, hasMedias, isLoadingMedias } = storeToRefs(contactInfosStore);

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
.medias__content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: $unnnic-spacing-xs;

  &--loading {
    display: grid;
    gap: $unnnic-spacing-sm;
  }
}
</style>
