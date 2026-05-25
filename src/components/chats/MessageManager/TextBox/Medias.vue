<template>
  <section class="text-box__medias">
    <section
      v-for="media in mediaUploadFiles"
      :key="media.name"
      class="text-box__medias__item"
    >
      <UnnnicIcon
        icon="draft"
        size="ant"
        scheme="gray-500"
      />
      <p
        :title="media.name"
        class="text-box__medias__item__name"
      >
        {{ media.name }}
      </p>
      <UnnnicIcon
        icon="delete"
        size="ant"
        scheme="red-500"
        clickable
        @click="removeMedia(media)"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { storeToRefs } from 'pinia';

const messageManager = useMessageManager();
const { mediaUploadFiles } = storeToRefs(messageManager);

defineOptions({
  name: 'MessageManagerTextBoxMedias',
});

const removeMedia = (media: File) => {
  mediaUploadFiles.value = mediaUploadFiles.value.filter(
    (mappedMedia) => mappedMedia.name !== media.name,
  );
};
</script>

<style scoped lang="scss">
.text-box {
  &__medias {
    display: flex;
    flex-direction: row;
    gap: $unnnic-space-2;
    width: 100%;
    &__item {
      display: flex;
      flex-direction: row;
      gap: $unnnic-space-1;
      align-items: center;

      background-color: $unnnic-color-bg-soft;
      border: 1px solid $unnnic-color-border-soft;
      border-radius: $unnnic-radius-2;
      padding: $unnnic-space-3;

      &__name {
        max-width: 88px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font: $unnnic-font-caption-2;
        color: $unnnic-color-fg-base;
      }
    }
  }
}
</style>
