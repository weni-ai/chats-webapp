<template>
  <AiTextImprovement
    v-if="isVisible"
    @improvement-received="emit('improvementReceived', $event)"
    @improvement-cancelled="emit('improvementCancelled')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';

import AiTextImprovement from '../AiTextImprovement.vue';

defineOptions({
  name: 'AiTextImprovementAction',
});

const emit = defineEmits<{
  improvementReceived: [text: string];
  improvementCancelled: [void];
}>();

const featureFlagStore = useFeatureFlag();

const isVisible = computed(() =>
  featureFlagStore.featureFlags?.active_features?.includes(
    'weniChatsAITextImprovement',
  ),
);
</script>
