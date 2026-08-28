<template>
  <section
    v-if="suggestions.length"
    class="suggestion-chips"
    data-testid="assistant-suggestion-chips"
  >
    <UnnnicChip
      v-for="suggestion in suggestions"
      :key="suggestion"
      type="single"
      isClickable
      :text="suggestion"
      data-testid="assistant-suggestion-chip"
      @click="emit('select', suggestion)"
    />
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantSuggestionChips',
});

withDefaults(
  defineProps<{
    suggestions?: string[];
  }>(),
  {
    suggestions: () => [],
  },
);

const emit = defineEmits<{
  select: [text: string];
}>();
</script>

<style lang="scss" scoped>
.suggestion-chips {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $unnnic-space-2;
  width: 100%;
  flex-shrink: 0;
}
</style>
