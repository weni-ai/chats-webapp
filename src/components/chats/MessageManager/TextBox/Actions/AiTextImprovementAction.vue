<template>
  <AiTextImprovement
    @improvement-received="emit('improvementReceived', $event)"
    @improvement-cancelled="emit('improvementCancelled')"
  />
</template>

<script setup lang="ts">
import AiTextImprovement from '../AiTextImprovement.vue';

defineOptions({
  name: 'AiTextImprovementAction',
});

const emit = defineEmits<{
  improvementReceived: [text: string];
  improvementCancelled: [void];
}>();
</script>
