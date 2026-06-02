<template>
  <button
    type="button"
    class="chat-messages__internal-note-media-document-card"
    @click="downloadMedia"
  >
    <section
      class="chat-messages__internal-note-media-document-card__icon-container"
    >
      <UnnnicIcon
        class="chat-messages__internal-note-media-document-card__icon"
        icon="draft"
        scheme="fg-base"
      />
    </section>
    <hr class="chat-messages__internal-note-media-document-card__divider" />
    <p
      :title="mediaName"
      class="chat-messages__internal-note-media-document-card__filename"
    >
      {{ mediaName }}
    </p>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Media from '@/services/api/resources/chats/media';
import { treatedMediaName } from '@/utils/medias';

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
  media: InternalNoteMedia;
}

const props = defineProps<Props>();

defineOptions({
  name: 'ChatMessagesInternalNoteMediaDocumentCard',
});

const mediaName = computed(() => {
  const rawName =
    props.media.url?.split('/').at(-1) || props.media.file?.name || '';

  try {
    return treatedMediaName(rawName);
  } catch {
    return rawName.split('?')[0];
  }
});

const downloadMedia = async () => {
  try {
    const mediaToDownload = props.media.url || props.media.preview;
    const filename =
      props.media.url?.split('/').at(-1) || props.media.file?.name;

    await Media.download({ media: mediaToDownload, name: filename });
  } catch (error) {
    console.error(
      'An error occurred when trying to download the media:',
      error,
    );
  }
};
</script>

<style scoped lang="scss">
.chat-messages__internal-note-media-document-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 200px;
  min-height: 200px;
  padding: 0;
  border: 1px solid $unnnic-color-border-soft;
  border-radius: $unnnic-radius-2;
  overflow: hidden;
  cursor: pointer;
  background-color: $unnnic-color-bg-base;

  :deep(.chat-messages__internal-note-media-document-card__icon) {
    font-size: $unnnic-space-16;
  }

  &__icon-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $unnnic-color-bg-soft;
  }

  &__divider {
    border: none;
    border-top: 1px solid $unnnic-color-border-soft;
    width: 100%;
    margin: 0;
  }

  &__filename {
    min-height: 56px;
    margin: 0;
    padding: $unnnic-space-6 $unnnic-space-4;
    font: $unnnic-font-action;
    color: $unnnic-color-fg-base;
    text-align: center;
    text-decoration: underline;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
}
</style>
