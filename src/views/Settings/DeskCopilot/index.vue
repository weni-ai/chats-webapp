<template>
  <section
    class="desk-copilot-settings"
    data-testid="desk-copilot-settings"
  >
    <InfoCard v-if="!isLoading && !linkedProject" />

    <section class="desk-copilot-settings__enable">
      <h2
        v-if="!linkedProject"
        class="desk-copilot-settings__enable-title"
      >
        {{ $t('config_chats.desk_copilot.enable_title') }}
      </h2>

      <EmptyState
        v-if="!isLoading && !linkedProject"
        :isCreateDisabled="isCreateDisabled"
        @open-create-modal="showCreateModal = true"
        @open-select-modal="openPicker('connect')"
      />

      <ConnectedProjectCard
        v-else-if="linkedProject"
        :linkedProject="linkedProject"
        @open-change-modal="openPicker('change')"
        @open-disconnect-modal="showDisconnectModal = true"
      />
    </section>

    <CreateCopilotProjectModal
      v-model="showCreateModal"
      @created="handleCreated"
    />
    <CopilotProjectPickerModal
      v-model="showPickerModal"
      :mode="pickerMode"
    />
    <DisconnectCopilotProjectModal v-model="showDisconnectModal" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import InfoCard from './InfoCard.vue';
import EmptyState from './EmptyState.vue';
import ConnectedProjectCard from './ConnectedProjectCard.vue';
import CreateCopilotProjectModal from './CreateCopilotProjectModal.vue';
import CopilotProjectPickerModal from './CopilotProjectPickerModal.vue';
import DisconnectCopilotProjectModal from './DisconnectCopilotProjectModal.vue';
import { useCopilotProject } from '@/composables/useCopilotProject';
import { useCopilotProjectsList } from '@/composables/useCopilotProjectsList';
import type { CopilotProject } from '@/services/api/resources/chats/copilotProject';

defineOptions({
  name: 'DeskCopilotSettings',
});

type PickerMode = 'connect' | 'change';

const {
  linkedProject,
  isLoading,
  isCreateDisabled,
  fetchLinkedProject,
  fetchCanCreate,
  setLinkedProject,
} = useCopilotProject();
const { fetchProjects } = useCopilotProjectsList();

const showCreateModal = ref(false);
const showPickerModal = ref(false);
const showDisconnectModal = ref(false);
const pickerMode = ref<PickerMode>('connect');

function openPicker(mode: PickerMode) {
  pickerMode.value = mode;
  showPickerModal.value = true;
}

function handleCreated(project: CopilotProject) {
  setLinkedProject(project);
  showCreateModal.value = false;
}

onMounted(() => {
  fetchLinkedProject();
  fetchCanCreate(true);
  fetchProjects();
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
