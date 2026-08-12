<template>
  <section
    class="desk-copilot"
    data-testid="desk-copilot"
  >
    <section
      class="desk-copilot__chat"
      data-testid="desk-copilot-chat"
    >
      <SummaryMessage />
    </section>

    <Disclaimer
      v-if="!isLoadingConnection && !isConfigured"
      :isHistory="isHistory"
      :isViewMode="isViewMode"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';
import Copilot from '@/services/api/resources/chats/copilot';

defineOptions({
  name: 'DeskCopilotTab',
});

withDefaults(
  defineProps<{
    isHistory?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    isHistory: false,
    isViewMode: false,
  },
);

const isConfigured = ref(false);
const isLoadingConnection = ref(true);

async function loadConnectionStatus() {
  isLoadingConnection.value = true;
  try {
    const connections = await Copilot.listConnections({ isPrincipal: false });
    isConfigured.value = Array.isArray(connections) && connections.length > 0;
  } catch {
    isConfigured.value = false;
  } finally {
    isLoadingConnection.value = false;
  }
}

onMounted(() => {
  loadConnectionStatus();
});
</script>

<style lang="scss" scoped>
.desk-copilot {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  padding: $unnnic-space-2;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__chat {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    flex: 1;
    min-height: 0;
    overflow: hidden auto;
  }
}
</style>
