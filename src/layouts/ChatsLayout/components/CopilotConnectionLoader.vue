<script setup lang="ts">
import { useCopilotConnection } from '@/composables/useCopilotConnection';

defineOptions({
  name: 'CopilotConnectionLoader',
});

useCopilotConnection();
</script>

<template>
  <span hidden />
</template>
