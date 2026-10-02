<template>
  <section
    ref="listRef"
    class="desk-copilot-history"
    data-testid="desk-copilot-history"
  >
    <SummaryMessage
      v-if="enableRoomSummary"
      :readOnly="true"
    />

    <AssistantMessageList
      v-if="isConfigured"
      :messages="messages"
      :isLoadingHistory="isLoading"
      :readOnly="true"
      :roomUuid="roomUuid"
    />

    <Disclaimer
      v-else-if="!isLoadingConnection"
      :hasSummary="enableRoomSummary"
      :isViewMode="isViewMode"
      :originProjectUuid="originProjectUuid"
    />
    <div ref="bottomAnchorRef" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAutoScroll } from '@/composables/assistant/useAutoScroll';
import { useCopilotHistory } from '@/composables/assistant/useCopilotHistory';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';
import AssistantMessageList from './assistant/AssistantMessageList.vue';

defineOptions({
  name: 'DeskCopilotHistoryView',
});

const props = withDefaults(
  defineProps<{
    isConfigured?: boolean;
    isLoadingConnection?: boolean;
    roomUuid?: string;
    enableRoomSummary?: boolean;
    isViewMode?: boolean;
    originProjectUuid?: string;
  }>(),
  {
    isConfigured: false,
    isLoadingConnection: false,
    roomUuid: undefined,
    enableRoomSummary: false,
    isViewMode: false,
    originProjectUuid: undefined,
  },
);

const roomUuidRef = computed(() => props.roomUuid);

const { messages, isLoading } = useCopilotHistory(roomUuidRef);
const { listRef, bottomAnchorRef } = useAutoScroll(messages, {
  isLoadingHistory: isLoading,
});
</script>

<style lang="scss" scoped>
.desk-copilot-history {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  flex: 1;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden auto;
  padding-bottom: $unnnic-space-2;

  :deep(.desk-copilot-disclaimer) {
    margin-top: auto;
  }
}
</style>
