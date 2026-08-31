<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="create-copilot-project-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('config_chats.desk_copilot.modal.title') }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose
          data-testid="create-copilot-project-close"
          @click="close"
        />
      </UnnnicDialogHeader>

      <section class="create-copilot-project-modal__body">
        <UnnnicInput
          v-model="projectName"
          :label="$t('config_chats.desk_copilot.modal.input_label')"
          data-testid="create-copilot-project-name"
        />
        <UnnnicDisclaimer
          type="informational"
          :description="$t('config_chats.desk_copilot.modal.disclaimer')"
          data-testid="create-copilot-project-disclaimer"
        />
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          data-testid="create-copilot-project-cancel"
          @click="close"
        />
        <UnnnicButton
          type="primary"
          :text="$t('create')"
          :loading="isSaving"
          :disabled="!canCreate"
          data-testid="create-copilot-project-submit"
          @click="createProject"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import CopilotProjectService, {
  type CopilotProject,
} from '@/services/api/resources/chats/copilotProject';
import { buildCopilotProjectUrl } from '@/utils/copilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

defineOptions({
  name: 'CreateCopilotProjectModal',
});

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [project: CopilotProject];
}>();

const { project } = storeToRefs(useConfig());
const projectName = ref('');
const isSaving = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const canCreate = computed(() => !!projectName.value.trim() && !isSaving.value);

watch(
  () => props.modelValue,
  (isVisible) => {
    if (isVisible) {
      projectName.value = project.value?.name ?? '';
    }
  },
  { immediate: true },
);

function close() {
  isOpen.value = false;
}

async function createProject() {
  const name = projectName.value.trim();
  const projectUuid = project.value?.uuid;
  if (!name || !projectUuid) return;

  isSaving.value = true;
  try {
    const createdProject = await CopilotProjectService.create(
      name,
      projectUuid,
    );

    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.desk_copilot.modal.success'),
        type: 'success',
      },
      seconds: 5,
    });

    window.open(
      buildCopilotProjectUrl(createdProject.uuid),
      '_blank',
      'noopener,noreferrer',
    );

    emit('created', createdProject);
    close();
  } catch {
    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.desk_copilot.modal.error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isSaving.value = false;
  }
}

defineExpose({ projectName, isSaving, isOpen, createProject });
</script>

<style lang="scss" scoped>
.create-copilot-project-modal__body {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  padding: $unnnic-space-6;
}
</style>
