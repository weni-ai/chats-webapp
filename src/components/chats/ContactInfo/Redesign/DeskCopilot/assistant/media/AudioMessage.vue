<template>
  <section
    class="audio-message"
    data-testid="assistant-audio-message"
  >
    <audio
      ref="audioRef"
      :src="src"
      preload="metadata"
      @loadedmetadata="handleLoadedMetadata"
      @timeupdate="handleTimeUpdate"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="handleEnded"
      @error="hasError = true"
    />

    <UnnnicButton
      type="tertiary"
      size="small"
      :iconCenter="isPlaying ? 'pause' : 'play_arrow'"
      :disabled="hasError || isLoading"
      data-testid="assistant-audio-play"
      @click="togglePlayPause"
    />

    <input
      class="audio-message__progress"
      type="range"
      min="0"
      :max="duration || 0"
      step="0.01"
      :value="currentTime"
      :disabled="hasError || isLoading"
      data-testid="assistant-audio-progress"
      @input="handleProgressChange"
    />

    <span class="audio-message__time">{{ displayTime }}</span>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

defineOptions({
  name: 'AssistantAudioMessage',
});

const props = defineProps<{
  src: string;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isLoading = ref(true);
const hasError = ref(false);

const displayTime = computed(() => {
  const seconds = currentTime.value < 0.5 ? duration.value : currentTime.value;
  return formatTime(seconds);
});

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

async function togglePlayPause() {
  const audio = audioRef.value;
  if (!audio || hasError.value) {
    return;
  }

  try {
    if (isPlaying.value) {
      audio.pause();
      return;
    }

    await audio.play();
  } catch (error) {
    console.error('Error toggling audio playback:', error);
    hasError.value = true;
  }
}

function handleLoadedMetadata() {
  const audio = audioRef.value;
  if (!audio) {
    return;
  }

  duration.value = audio.duration || 0;
  isLoading.value = false;
  hasError.value = false;
}

function handleTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime || 0;
}

function handleEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
}

function handleProgressChange(event: Event) {
  const audio = audioRef.value;
  const target = event.target as HTMLInputElement;
  if (!audio) {
    return;
  }

  const nextTime = Number(target.value);
  audio.currentTime = nextTime;
  currentTime.value = nextTime;
}
</script>

<style lang="scss" scoped>
.audio-message {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  width: 100%;
  min-width: 0;
  padding: $unnnic-space-2 $unnnic-space-3;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  audio {
    display: none;
  }

  &__progress {
    flex: 1;
    min-width: 0;
  }

  &__time {
    flex-shrink: 0;
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-muted;
  }
}
</style>
