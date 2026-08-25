<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <section
    class="chat-messages__medias-grid"
    data-testid="medias-grid"
    @click.stop
  >
    <section
      v-for="media in previewableMedias"
      :key="getMediaKey(media)"
      class="chat-messages__medias-grid__slot"
      :class="{
        'chat-messages__medias-grid__slot--interactive':
          !showMediaLoading(media) && isImage(media),
      }"
    >
      <Transition name="medias-grid-loading">
        <div
          v-if="showMediaLoading(media)"
          class="chat-messages__medias-grid__loading"
        >
          <UnnnicIconLoading
            scheme="fg-base"
            size="lg"
          />
        </div>
      </Transition>

      <button
        v-if="isImage(media)"
        type="button"
        class="chat-messages__medias-grid__preview-button"
        :disabled="!getMediaSrc(media)"
        @click="openFullscreen(media)"
      >
        <img
          v-if="getMediaSrc(media)"
          :ref="(element) => registerImage(element, media)"
          class="chat-messages__medias-grid__preview"
          :class="{
            'chat-messages__medias-grid__preview--visible':
              isMediaRendered(media),
          }"
          :src="getMediaSrc(media)"
          @load="handleMediaLoad(media)"
        />
      </button>

      <div
        v-else-if="isVideo(media) && !isLoading(media)"
        class="chat-messages__medias-grid__content"
      >
        <VideoPlayer
          class="chat-messages__medias-grid__video media"
          :src="getMediaSrc(media)"
        />
      </div>

      <div
        v-else-if="isDocument(media) && !isLoading(media)"
        class="chat-messages__medias-grid__content"
      >
        <MediaDocumentCard :media="media" />
      </div>
    </section>

    <FullscreenPreview
      v-if="isFullscreen && currentMedia"
      :downloadMediaUrl="getMediaSrc(currentMedia)"
      :downloadMediaName="currentMedia.message || ''"
      :mediaCurrent="currentMediaIndex"
      :mediaTotal="imageMedias.length"
      @close="closeFullscreen"
      @next="nextMedia"
      @previous="previousMedia"
    >
      <img
        :src="getMediaSrc(currentMedia)"
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
import MediaDocumentCard from './ChatMessageInternalNote/MediaDocumentCard.vue';

interface GridMedia {
  content_type?: string;
  url?: string;
  message?: string;
  preview?: string;
  tempId?: string;
  isLoading?: boolean;
  file?: File | { name?: string };
}

interface Props {
  medias: GridMedia[];
}

const props = defineProps<Props>();

defineOptions({
  name: 'ChatMessagesMediasGrid',
});

const isFullscreen = ref(false);
const currentMedia = ref<GridMedia | null>(null);
const renderedMediaKeys = ref<Record<string, boolean>>({});

const getMediaSrc = (media?: GridMedia | null) =>
  media?.url || media?.preview || '';

const getMediaKey = (media: GridMedia) =>
  media.tempId || media.message || media.url || media.preview;

const isLoading = (media: GridMedia) =>
  !!media.isLoading || (!getMediaSrc(media) && !!media.file);

const isMediaRendered = (media: GridMedia) =>
  !!renderedMediaKeys.value[getMediaKey(media)];

const isMediaOfType = (media: GridMedia, type: string) =>
  media?.content_type?.includes(type);

const isImage = (media: GridMedia) => isMediaOfType(media, 'image');

const isVideo = (media: GridMedia) =>
  isMediaOfType(media, 'video') || isMediaOfType(media, 'mp4');

const isAudio = (media: GridMedia) => isMediaOfType(media, 'audio');

const isGeolocation = (media: GridMedia) => isMediaOfType(media, 'geo');

const isDocument = (media: GridMedia) =>
  !isImage(media) &&
  !isVideo(media) &&
  !isAudio(media) &&
  !isGeolocation(media);

const showMediaLoading = (media: GridMedia) => {
  if (isLoading(media)) {
    return true;
  }

  if (isImage(media) && getMediaSrc(media) && !isMediaRendered(media)) {
    return true;
  }

  return false;
};

const handleMediaLoad = (media: GridMedia) => {
  const key = getMediaKey(media);

  if (renderedMediaKeys.value[key]) {
    return;
  }

  renderedMediaKeys.value = {
    ...renderedMediaKeys.value,
    [key]: true,
  };
};

const registerImage = (element: unknown, media: GridMedia) => {
  if (!(element instanceof HTMLImageElement) || !element.complete) {
    return;
  }

  handleMediaLoad(media);
};

const previewableMedias = computed(() =>
  props.medias.filter(
    (media) =>
      isLoading(media) || isImage(media) || isVideo(media) || isDocument(media),
  ),
);

const imageMedias = computed(() =>
  props.medias.filter((media) => isImage(media) && getMediaSrc(media)),
);

const currentMediaIndex = computed(() => {
  const currentSrc = getMediaSrc(currentMedia.value);
  if (!currentSrc) {
    return 0;
  }

  return (
    imageMedias.value.findIndex((media) => getMediaSrc(media) === currentSrc) +
    1
  );
});

const openFullscreen = (media: GridMedia) => {
  if (!getMediaSrc(media)) {
    return;
  }

  currentMedia.value = media;
  isFullscreen.value = true;
};

const closeFullscreen = () => {
  isFullscreen.value = false;
  currentMedia.value = null;
};

const nextMedia = () => {
  if (!currentMedia.value) return;

  const currentSrc = getMediaSrc(currentMedia.value);
  const currentIndex = imageMedias.value.findIndex(
    (media) => getMediaSrc(media) === currentSrc,
  );

  if (currentIndex + 1 < imageMedias.value.length) {
    currentMedia.value = imageMedias.value[currentIndex + 1];
  }
};

const previousMedia = () => {
  if (!currentMedia.value) return;

  const currentSrc = getMediaSrc(currentMedia.value);
  const currentIndex = imageMedias.value.findIndex(
    (media) => getMediaSrc(media) === currentSrc,
  );

  if (currentIndex - 1 >= 0) {
    currentMedia.value = imageMedias.value[currentIndex - 1];
  }
};
</script>

<style scoped lang="scss">
.chat-messages__medias-grid {
  display: flex;
  flex-direction: row;
  gap: $unnnic-space-2;
  flex-wrap: wrap;

  &__slot {
    position: relative;
    width: 200px;
    height: 200px;
    min-width: 200px;
    min-height: 200px;
    flex-shrink: 0;
    border-radius: $unnnic-radius-2;
    overflow: hidden;
    background-color: $unnnic-color-bg-soft;

    &--interactive {
      cursor: pointer;
    }
  }

  &__content {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;

    :deep(.chat-messages__internal-note-media-document-card) {
      width: 100%;
      height: 100%;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $unnnic-color-bg-soft;
  }

  &__preview-button {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: inherit;

    &:disabled {
      cursor: default;
      pointer-events: none;
    }
  }

  &__preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;

    &--visible {
      opacity: 1;
    }
  }

  &__video {
    width: 100%;
    height: 100%;
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

.medias-grid-loading-leave-active {
  transition: opacity 0.2s ease;
}

.medias-grid-loading-leave-to {
  opacity: 0;
}
</style>
