<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <section
    class="chat-messages__internal-note-medias"
    @click.stop
  >
    <template
      v-for="media in previewableMedias"
      :key="media.message || media.url"
    >
      <button
        v-if="isImage(media)"
        type="button"
        class="chat-messages__internal-note-medias__item"
        @click="openFullscreen(media)"
      >
        <img
          class="chat-messages__internal-note-medias__preview"
          :src="media.url || media.preview"
        />
      </button>
      <VideoPlayer
        v-else-if="isVideo(media)"
        class="chat-messages__internal-note-medias__video media"
        :src="media.url || media.preview"
      />
      <MediaDocumentCard
        v-else-if="isDocument(media)"
        :media="media"
      />
    </template>

    <FullscreenPreview
      v-if="isFullscreen && currentMedia"
      :downloadMediaUrl="currentMedia.url"
      :downloadMediaName="currentMedia.message || ''"
      @close="closeFullscreen"
      @next="nextMedia"
      @previous="previousMedia"
    >
      <img
        :src="currentMedia.url"
        @click.stop
        @keypress.enter.stop
      />
    </FullscreenPreview>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import VideoPlayer from '@/components/chats/MediaMessage/Previews/Video.vue';
import FullscreenPreview from '@/components/chats/MediaMessage/Previews/Fullscreen.vue';
import MediaDocumentCard from './MediaDocumentCard.vue';

interface InternalNoteMedia {
  content_type: string;
  url: string;
  message?: string;
  preview?: string;
  file?: { name?: string };
}

interface Props {
  medias: InternalNoteMedia[];
}

const props = defineProps<Props>();

defineOptions({
  name: 'ChatMessagesInternalNoteMedias',
});

const isFullscreen = ref(false);
const currentMedia = ref<InternalNoteMedia | null>(null);

const isMediaOfType = (media: InternalNoteMedia, type: string) =>
  media?.content_type?.includes(type);

const isImage = (media: InternalNoteMedia) => isMediaOfType(media, 'image');

const isVideo = (media: InternalNoteMedia) =>
  isMediaOfType(media, 'video') || isMediaOfType(media, 'mp4');

const isAudio = (media: InternalNoteMedia) => isMediaOfType(media, 'audio');

const isGeolocation = (media: InternalNoteMedia) => isMediaOfType(media, 'geo');

const isDocument = (media: InternalNoteMedia) =>
  !isImage(media) &&
  !isVideo(media) &&
  !isAudio(media) &&
  !isGeolocation(media);

const previewableMedias = computed(() =>
  props.medias.filter(
    (media) => isImage(media) || isVideo(media) || isDocument(media),
  ),
);

const imageMedias = computed(() =>
  props.medias.filter((media) => isImage(media)),
);

const openFullscreen = (media: InternalNoteMedia) => {
  currentMedia.value = media;
  isFullscreen.value = true;
};

const closeFullscreen = () => {
  isFullscreen.value = false;
  currentMedia.value = null;
};

const nextMedia = () => {
  if (!currentMedia.value) return;

  const currentIndex = imageMedias.value.findIndex(
    (media) => media.url === currentMedia.value?.url,
  );

  if (currentIndex + 1 < imageMedias.value.length) {
    currentMedia.value = imageMedias.value[currentIndex + 1];
  }
};

const previousMedia = () => {
  if (!currentMedia.value) return;

  const currentIndex = imageMedias.value.findIndex(
    (media) => media.url === currentMedia.value?.url,
  );

  if (currentIndex - 1 >= 0) {
    currentMedia.value = imageMedias.value[currentIndex - 1];
  }
};
</script>

<style scoped lang="scss">
.chat-messages__internal-note-medias {
  display: flex;
  flex-direction: row;
  gap: $unnnic-space-2;
  flex-wrap: wrap;

  &__item {
    position: relative;
    width: 200px;
    height: 200px;
    padding: 0;
    border: none;
    border-radius: $unnnic-radius-2;
    overflow: hidden;
    cursor: pointer;
    background-color: $unnnic-color-bg-soft;
  }

  &__preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  &__video {
    width: 200px;
    height: 200px;
    border-radius: $unnnic-radius-2;
    overflow: hidden;

    :deep(.video-preview) {
      width: 100%;
      height: 100%;
    }

    :deep(.plyr) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
