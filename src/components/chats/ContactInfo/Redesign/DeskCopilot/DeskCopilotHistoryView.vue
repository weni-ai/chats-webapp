<template>
  <section
    class="desk-copilot-history"
    data-testid="desk-copilot-history"
  >
    <SummaryMessage
      v-if="enableRoomSummary"
      :readOnly="true"
    />

    <UnnnicButton
      v-if="showHistoryButton"
      class="desk-copilot-history__view-button"
      type="secondary"
      size="large"
      iconLeft="arrow_outward"
      :text="$t('contact_info.desk_copilot.view_complete_history')"
      :loading="isLoadingUrl"
      :disabled="!historyUrl"
      data-testid="desk-copilot-view-history-button"
      @click="openHistory"
    />

    <Disclaimer
      v-else-if="!isConfigured && !isLoadingConnection"
      :hasSummary="enableRoomSummary"
      :isViewMode="isViewMode"
      :originProjectUuid="originProjectUuid"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';

import {
  useCopilotConversationUrl,
  type CopilotConversationRoom,
} from '@/composables/assistant/useCopilotConversationUrl';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';

defineOptions({
  name: 'DeskCopilotHistoryView',
});

const props = withDefaults(
  defineProps<{
    isConfigured?: boolean;
    isLoadingConnection?: boolean;
    room?: CopilotConversationRoom | null;
    enableRoomSummary?: boolean;
    isViewMode?: boolean;
    originProjectUuid?: string;
  }>(),
  {
    isConfigured: false,
    isLoadingConnection: false,
    room: undefined,
    enableRoomSummary: false,
    isViewMode: false,
    originProjectUuid: undefined,
  },
);

const originProjectUuidRef = toRef(props, 'originProjectUuid');
const roomRef = toRef(props, 'room');
const isConfiguredRef = toRef(props, 'isConfigured');

const { url: historyUrl, isLoading: isLoadingUrl } = useCopilotConversationUrl(
  originProjectUuidRef,
  roomRef,
  isConfiguredRef,
);

const showHistoryButton = computed(
  () => props.isConfigured && (isLoadingUrl.value || !!historyUrl.value),
);

function openHistory() {
  if (!historyUrl.value) {
    return;
  }

  window.open(historyUrl.value, '_blank', 'noopener,noreferrer');
}
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

  &__view-button {
    width: 100%;
    margin-top: auto;
    flex-shrink: 0;
  }

  :deep(.desk-copilot-disclaimer) {
    margin-top: auto;
  }
}
</style>
