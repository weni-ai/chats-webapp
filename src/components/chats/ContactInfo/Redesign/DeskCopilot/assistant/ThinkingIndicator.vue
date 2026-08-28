<template>
  <section
    class="thinking-indicator"
    data-testid="assistant-thinking-indicator"
  >
    <UnnnicIcon
      class="thinking-indicator__icon"
      icon="progress_activity"
      size="sm"
      scheme="fg-emphasized"
    />
    <section class="thinking-indicator__text-wrapper">
      <section
        class="thinking-indicator__text-track"
        :class="{
          'thinking-indicator__text-track--sliding':
            isAnimatingOut || isInitializing,
        }"
      >
        <p
          v-if="isInitializing"
          class="thinking-indicator__text"
        >
          &nbsp;
        </p>
        <p
          v-else-if="isAnimatingOut"
          class="thinking-indicator__text"
        >
          {{ currentMessage }}
        </p>
        <p
          :key="currentMessageIndex"
          class="thinking-indicator__text"
          data-testid="assistant-thinking-text"
        >
          {{ isAnimatingOut ? nextMessage : currentMessage }}
        </p>
      </section>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'AssistantThinkingIndicator',
});

const MESSAGE_KEYS = [
  'processing',
  'connecting',
  'refining',
  'structuring',
  'almost',
] as const;

const INIT_DELAY_MS = 500;
const TRANSITION_MS = 500;
const MIN_ROTATION_MS = 4000;
const MAX_ROTATION_MS = 7500;

const { t } = useI18n();

const currentMessageIndex = ref(0);
const isAnimatingOut = ref(false);
const isInitializing = ref(true);

let rotationTimer: ReturnType<typeof setTimeout> | null = null;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;
let initTimer: ReturnType<typeof setTimeout> | null = null;

const currentMessage = computed(() =>
  t(
    `contact_info.desk_copilot.assistant.thinking_messages.${MESSAGE_KEYS[currentMessageIndex.value]}`,
  ),
);

const nextMessage = computed(() => {
  const nextIndex = currentMessageIndex.value + 1;

  if (nextIndex >= MESSAGE_KEYS.length) {
    return currentMessage.value;
  }

  return t(
    `contact_info.desk_copilot.assistant.thinking_messages.${MESSAGE_KEYS[nextIndex]}`,
  );
});

function clearTimers() {
  if (rotationTimer) {
    clearTimeout(rotationTimer);
    rotationTimer = null;
  }

  if (transitionTimer) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }

  if (initTimer) {
    clearTimeout(initTimer);
    initTimer = null;
  }
}

function nextRotationDelay() {
  return MIN_ROTATION_MS + Math.random() * (MAX_ROTATION_MS - MIN_ROTATION_MS);
}

function scheduleNextMessage() {
  if (rotationTimer) {
    clearTimeout(rotationTimer);
    rotationTimer = null;
  }

  if (currentMessageIndex.value >= MESSAGE_KEYS.length - 1) {
    return;
  }

  rotationTimer = setTimeout(() => {
    isAnimatingOut.value = true;
    transitionTimer = setTimeout(() => {
      currentMessageIndex.value += 1;
      isAnimatingOut.value = false;
    }, TRANSITION_MS);
  }, nextRotationDelay());
}

onMounted(() => {
  initTimer = setTimeout(() => {
    isInitializing.value = false;
  }, INIT_DELAY_MS);
});

watch(currentMessageIndex, scheduleNextMessage, { immediate: true });

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<style lang="scss" scoped>
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  width: 100%;
  height: $unnnic-font-size-body-gt;

  &__icon {
    flex-shrink: 0;
    animation: assistant-spin 1s linear infinite;
  }

  &__text-wrapper {
    height: $unnnic-font-size-body-gt;
    overflow: hidden;
  }

  &__text-track {
    display: flex;
    flex-direction: column;

    &--sliding {
      animation: thinking-push 0.5s ease-in-out forwards;

      .thinking-indicator__text:first-child {
        animation: thinking-fade-out 0.5s ease-in-out forwards;
      }

      .thinking-indicator__text:last-child {
        animation: thinking-fade-in 0.5s ease-in-out forwards;
      }
    }
  }

  &__text {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

@keyframes assistant-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes thinking-push {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-50%);
  }
}

@keyframes thinking-fade-out {
  0%,
  25% {
    opacity: 1;
  }

  75%,
  100% {
    opacity: 0;
  }
}

@keyframes thinking-fade-in {
  0%,
  25% {
    opacity: 0;
  }

  75%,
  100% {
    opacity: 1;
  }
}
</style>
