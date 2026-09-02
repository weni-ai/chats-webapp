<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="disconnect-copilot-project-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle data-testid="disconnect-copilot-project-title">
          {{ $t('config_chats.desk_copilot.disconnect_modal.title') }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose
          data-testid="disconnect-copilot-project-close"
          @click="close"
        />
      </UnnnicDialogHeader>

      <p
        class="disconnect-copilot-project-modal__description"
        data-testid="disconnect-copilot-project-description"
      >
        {{ $t('config_chats.desk_copilot.disconnect_modal.description') }}
      </p>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          :disabled="isSaving"
          data-testid="disconnect-copilot-project-cancel"
          @click="close"
        />
        <UnnnicButton
          type="warning"
          :text="$t('config_chats.desk_copilot.disconnect_modal.confirm')"
          :loading="isSaving"
          data-testid="disconnect-copilot-project-submit"
          @click="disconnect"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useCopilotProject } from '@/composables/useCopilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

defineOptions({
  name: 'DisconnectCopilotProjectModal',
});

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { disconnectLinkedProject } = useCopilotProject();
const isSaving = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function close() {
  if (isSaving.value) return;
  isOpen.value = false;
}

async function disconnect() {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    await disconnectLinkedProject();

    callUnnnicAlert({
      props: {
        text: i18n.global.t(
          'config_chats.desk_copilot.disconnect_modal.success',
        ),
        type: 'success',
      },
      seconds: 5,
    });

    isOpen.value = false;
  } catch {
    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.desk_copilot.disconnect_modal.error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isSaving.value = false;
  }
}

defineExpose({ isSaving, isOpen, disconnect });
</script>

<style lang="scss" scoped>
.disconnect-copilot-project-modal__description {
  margin: 0;
  padding: $unnnic-space-6;
  font: $unnnic-font-body;
  color: $unnnic-color-fg-base;
}
</style>
