<template>
  <section
    class="desk-copilot-settings"
    data-testid="desk-copilot-settings"
  >
    <UnnnicDisclaimer
      v-if="showNoPermissionDisclaimer"
      type="informational"
      :description="$t('config_chats.desk_copilot.no_permission_disclaimer')"
      data-testid="desk-copilot-no-permission"
    />

    <InfoCard v-if="showEmptyState" />

    <UnnnicDisclaimer
      v-if="showDisconnectedDisclaimer"
      type="attention"
      :title="$t('config_chats.desk_copilot.disconnected_disclaimer.title')"
      :description="
        $t('config_chats.desk_copilot.disconnected_disclaimer.description')
      "
      data-testid="desk-copilot-disconnected-disclaimer"
    />

    <section
      v-if="showEmptyState || showProjectCard"
      class="desk-copilot-settings__enable"
    >
      <h2
        v-if="showEmptyState"
        class="desk-copilot-settings__enable-title"
      >
        {{ $t('config_chats.desk_copilot.enable_title') }}
      </h2>

      <EmptyState
        v-if="showEmptyState"
        :isCreateDisabled="isCreateDisabled"
        @open-create-modal="showCreateModal = true"
      />

      <ConnectedProjectCard
        v-else-if="linkedProject"
        :linkedProject="linkedProject"
        :readOnly="isReadOnly"
        @open-disconnect-modal="showDisconnectModal = true"
        @open-reconnect-modal="showReconnectModal = true"
      />
    </section>

    <CreateCopilotProjectModal
      v-model="showCreateModal"
      @created="handleCreated"
    />
    <DisconnectCopilotProjectModal v-model="showDisconnectModal" />
    <ReconnectCopilotProjectModal v-model="showReconnectModal" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import InfoCard from './InfoCard.vue';
import EmptyState from './EmptyState.vue';
import ConnectedProjectCard from './ConnectedProjectCard.vue';
import CreateCopilotProjectModal from './CreateCopilotProjectModal.vue';
import DisconnectCopilotProjectModal from './DisconnectCopilotProjectModal.vue';
import ReconnectCopilotProjectModal from './ReconnectCopilotProjectModal.vue';
import { useCopilotProject } from '@/composables/useCopilotProject';
import type { CopilotProject } from '@/services/api/resources/chats/copilotProject';

defineOptions({
  name: 'DeskCopilotSettings',
});

const {
  linkedProject,
  isLoading,
  isLoadingCanCreate,
  canCreateProject,
  isCreateDisabled,
  fetchLinkedProject,
  fetchCanCreate,
  setLinkedProject,
} = useCopilotProject();

const showCreateModal = ref(false);
const showDisconnectModal = ref(false);
const showReconnectModal = ref(false);

const isReady = computed(() => !isLoading.value && !isLoadingCanCreate.value);
const isReadOnly = computed(() => !canCreateProject.value);
const showEmptyState = computed(
  () => isReady.value && canCreateProject.value && !linkedProject.value,
);
const showProjectCard = computed(() => {
  if (!isReady.value || !linkedProject.value) {
    return false;
  }

  if (canCreateProject.value) {
    return true;
  }

  return !!linkedProject.value.isConnected;
});
const showDisconnectedDisclaimer = computed(
  () =>
    isReady.value &&
    canCreateProject.value &&
    !!linkedProject.value &&
    !linkedProject.value.isConnected,
);
const showNoPermissionDisclaimer = computed(
  () =>
    isReady.value &&
    !canCreateProject.value &&
    !linkedProject.value?.isConnected,
);

function handleCreated(project: CopilotProject) {
  setLinkedProject(project);
  showCreateModal.value = false;
}

onMounted(() => {
  fetchLinkedProject();
  fetchCanCreate(true);
});
</script>

<style lang="scss" scoped>
.desk-copilot-settings {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-6;
  width: 100%;

  &__enable {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    flex: 1;
    min-height: 0;
  }

  &__enable-title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }
}
</style>
