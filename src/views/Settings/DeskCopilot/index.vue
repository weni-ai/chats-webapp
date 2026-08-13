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
        @open-create-modal="showCreateModal = true"
      />

      <ConnectedProjectCard
        v-else-if="linkedProject"
        :linkedProject="linkedProject"
      />
    </section>

    <CreateCopilotProjectModal
      v-model="showCreateModal"
      @created="handleCreated"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import InfoCard from './InfoCard.vue';
import EmptyState from './EmptyState.vue';
import ConnectedProjectCard from './ConnectedProjectCard.vue';
import CreateCopilotProjectModal from './CreateCopilotProjectModal.vue';
import { useCopilotProject } from '@/composables/useCopilotProject';
import type { CopilotProject } from '@/services/api/resources/chats/copilotProject';

defineOptions({
  name: 'DeskCopilotSettings',
});

const { linkedProject, isLoading, fetchLinkedProject, setLinkedProject } =
  useCopilotProject();

const showCreateModal = ref(false);

function handleCreated(project: CopilotProject) {
  setLinkedProject(project);
  showCreateModal.value = false;
}

onMounted(() => {
  fetchLinkedProject();
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
