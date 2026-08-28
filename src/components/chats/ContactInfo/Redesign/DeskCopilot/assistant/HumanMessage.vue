<template>
  <section
    class="human-message"
    data-testid="assistant-human-message"
  >
    <p class="human-message__text">{{ text }}</p>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantHumanMessage',
});

defineProps<{
  text: string;
}>();
</script>

<style lang="scss" scoped>
.human-message {
  display: flex;
  justify-content: flex-end;
  width: 100%;

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
