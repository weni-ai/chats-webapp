<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <section
    class="chat-messages__internal-note-medias"
    @click.stop
  >
    <section
      v-for="media in previewableMedias"
      :key="getMediaKey(media)"
      class="chat-messages__internal-note-medias__slot"
      :class="{
        'chat-messages__internal-note-medias__slot--interactive':
          !showMediaLoading(media) && isImage(media),
      }"
    >
      <Transition name="internal-note-media-loading">
        <div
          v-if="showMediaLoading(media)"
          class="chat-messages__internal-note-medias__loading"
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
        class="chat-messages__internal-note-medias__preview-button"
        :disabled="!media.url"
        @click="openFullscreen(media)"
      >
        <img
          v-if="media.url"
          :ref="(element) => registerImage(element, media)"
          class="chat-messages__internal-note-medias__preview"
          :class="{
            'chat-messages__internal-note-medias__preview--visible':
              isMediaRendered(media),
          }"
          :src="media.url"
          @load="handleMediaLoad(media)"
        />
      </button>

      <div
        v-else-if="isVideo(media) && !isLoading(media)"
        class="chat-messages__internal-note-medias__content"
      >
        <VideoPlayer
          class="chat-messages__internal-note-medias__video media"
          :src="media.url || media.preview"
        />
      </div>

      <div
        v-else-if="isDocument(media) && !isLoading(media)"
        class="chat-messages__internal-note-medias__content"
      >
        <MediaDocumentCard :media="media" />
      </div>
    </section>

    <FullscreenPreview
      v-if="isFullscreen && currentMedia"
      :downloadMediaUrl="currentMedia.url"
      :downloadMediaName="currentMedia.message || ''"
      :mediaCurrent="currentMediaIndex"
      :mediaTotal="imageMedias.length"
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
  url?: string;
  message?: string;
  preview?: string;
  tempId?: string;
  isLoading?: boolean;
  file?: File | { name?: string };
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
const renderedMediaKeys = ref<Record<string, boolean>>({});

const getMediaKey = (media: InternalNoteMedia) =>
  media.tempId || media.message || media.url || media.preview;

const isLoading = (media: InternalNoteMedia) =>
  !!media.isLoading || (!media.url && !media.preview && !!media.file);

const isMediaRendered = (media: InternalNoteMedia) =>
  !!renderedMediaKeys.value[getMediaKey(media)];

const showMediaLoading = (media: InternalNoteMedia) => {
  if (isLoading(media)) {
    return true;
  }

  if (isImage(media) && media.url && !isMediaRendered(media)) {
    return true;
  }

  return false;
};

const handleMediaLoad = (media: InternalNoteMedia) => {
  const key = getMediaKey(media);

  if (renderedMediaKeys.value[key]) {
    return;
  }

  renderedMediaKeys.value = {
    ...renderedMediaKeys.value,
    [key]: true,
  };
};

const registerImage = (element: unknown, media: InternalNoteMedia) => {
  if (!(element instanceof HTMLImageElement) || !element.complete) {
    return;
  }

  handleMediaLoad(media);
};

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
    (media) =>
      isLoading(media) || isImage(media) || isVideo(media) || isDocument(media),
  ),
);

const imageMedias = computed(() =>
  props.medias.filter((media) => isImage(media) && media.url),
);

const currentMediaIndex = computed(() => {
  if (!currentMedia.value?.url) {
    return 0;
  }

  return (
    imageMedias.value.findIndex(
      (media) => media.url === currentMedia.value?.url,
    ) + 1
  );
});

const openFullscreen = (media: InternalNoteMedia) => {
  if (!media.url) {
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

.internal-note-media-loading-leave-active {
  transition: opacity 0.2s ease;
}

.internal-note-media-loading-leave-to {
  opacity: 0;
}
</style>
