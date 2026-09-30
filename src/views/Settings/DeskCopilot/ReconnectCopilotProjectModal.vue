<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="reconnect-copilot-project-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle data-testid="reconnect-copilot-project-title">
          {{ $t('config_chats.desk_copilot.reconnect_modal.title') }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose
          data-testid="reconnect-copilot-project-close"
          @click="close"
        />
      </UnnnicDialogHeader>

      <p
        class="reconnect-copilot-project-modal__description"
        data-testid="reconnect-copilot-project-description"
      >
        {{ $t('config_chats.desk_copilot.reconnect_modal.description') }}
      </p>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          :disabled="isSaving"
          data-testid="reconnect-copilot-project-cancel"
          @click="close"
        />
        <UnnnicButton
          type="primary"
          :text="$t('config_chats.desk_copilot.reconnect_modal.confirm')"
          :loading="isSaving"
          data-testid="reconnect-copilot-project-submit"
          @click="reconnect"
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
  name: 'ReconnectCopilotProjectModal',
});

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { reconnectLinkedProject } = useCopilotProject();
const isSaving = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function close() {
  if (isSaving.value) return;
  isOpen.value = false;
}

async function reconnect() {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    await reconnectLinkedProject();

    callUnnnicAlert({
      props: {
        text: i18n.global.t(
          'config_chats.desk_copilot.reconnect_modal.success',
        ),
        type: 'success',
      },
      seconds: 5,
    });

    isOpen.value = false;
  } catch {
    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.desk_copilot.reconnect_modal.error'),
        type: 'error',
      },
      seconds: 5,
    });
    isOpen.value = false;
  } finally {
    isSaving.value = false;
  }
}

defineExpose({ isSaving, isOpen, reconnect });
</script>

<style lang="scss" scoped>
.reconnect-copilot-project-modal__description {
  margin: 0;
  padding: $unnnic-space-6;
  font: $unnnic-font-body;
  color: $unnnic-color-fg-base;
}
</style>
