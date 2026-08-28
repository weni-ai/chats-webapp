<template>
  <section
    class="typing-indicator"
    data-testid="assistant-typing-indicator"
  >
    <span class="typing-indicator__dot" />
    <span class="typing-indicator__dot" />
    <span class="typing-indicator__dot" />
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantTypingIndicator',
});
</script>

<style lang="scss" scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: $unnnic-space-1;
  width: 100%;
  height: $unnnic-font-size-body-gt;

  &__dot {
    width: $unnnic-space-1;
    height: $unnnic-space-1;
    border-radius: 50%;
    background-color: $unnnic-color-fg-emphasized;
    animation: typing-bounce 1.3s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }

    &:nth-child(3) {
      animation-delay: 0s;
    }
  }
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.1;
  }

  40% {
    transform: translateY(-2px);
    opacity: 1;
  }
}
</style>
