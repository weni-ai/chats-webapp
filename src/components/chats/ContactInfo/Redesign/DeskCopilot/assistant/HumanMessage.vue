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
    max-width: 100%;
    padding: $unnnic-space-3 $unnnic-space-4;
    border-radius: $unnnic-radius-2;
    background-color: $unnnic-color-bg-base;
    border: 1px solid $unnnic-color-border-base;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    overflow-wrap: anywhere;
  }
}
</style>
