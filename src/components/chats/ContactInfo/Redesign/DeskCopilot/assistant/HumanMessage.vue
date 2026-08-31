<template>
  <section
    class="human-message"
    data-testid="assistant-human-message"
    :class="{ 'human-message--media': isMedia }"
  >
    <AudioMessage
      v-if="type === 'audio' && media"
      :src="media"
    />
    <ImageMessage
      v-else-if="type === 'image' && media"
      :src="media"
      :filename="filename"
    />
    <FileMessage
      v-else-if="(type === 'file' || type === 'video') && media"
      :src="media"
      :filename="filename"
    />
    <p
      v-else
      class="human-message__text"
    >
      {{ text }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AssistantMessageType } from '@/services/assistant/types';
import AudioMessage from './media/AudioMessage.vue';
import ImageMessage from './media/ImageMessage.vue';
import FileMessage from './media/FileMessage.vue';

defineOptions({
  name: 'AssistantHumanMessage',
});

const props = withDefaults(
  defineProps<{
    text: string;
    type?: AssistantMessageType;
    media?: string;
    filename?: string;
  }>(),
  {
    type: 'text',
    media: undefined,
    filename: undefined,
  },
);

const isMedia = computed(() => props.type !== 'text');
</script>

<style lang="scss" scoped>
.human-message {
  display: flex;
  justify-content: flex-end;
  width: 100%;

  &--media {
    :deep(.audio-message),
    :deep(.image-message),
    :deep(.file-message) {
      max-width: 75%;
      animation: assistant-bubble-in-right 0.3s ease-out both;
      transform-origin: top right;
    }
  }

  &__text {
    max-width: 75%;
    min-width: 0;
    padding: $unnnic-space-3 $unnnic-space-4;
    border-radius: $unnnic-radius-2;
    background-color: $unnnic-color-bg-base;
    border: 1px solid $unnnic-color-border-base;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    overflow-wrap: anywhere;
    animation: assistant-bubble-in-right 0.3s ease-out both;
    transform-origin: top right;
  }
}

@keyframes assistant-bubble-in-right {
  0% {
    opacity: 0;
    transform: translateX(2px) scale(0.8);
  }

  60% {
    transform: translateX(-2px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
