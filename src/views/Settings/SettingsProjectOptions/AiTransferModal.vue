<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="ai-transfer-modal"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('config_chats.project_configs.ai_transfer.modal_title') }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose @click="close" />
      </UnnnicDialogHeader>

      <section class="ai-transfer-modal__body">
        <UnnnicTextArea
          v-model="criteriaText"
          :label="$t('config_chats.project_configs.ai_transfer.textarea_label')"
          :placeholder="
            $t('config_chats.project_configs.ai_transfer.textarea_placeholder')
          "
          :maxLength="1000"
          data-testid="ai-transfer-criteria-textarea"
        />
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          data-testid="ai-transfer-cancel-btn"
          @click="close"
        />
        <UnnnicButton
          type="primary"
          :text="$t('save')"
          :loading="isSaving"
          :disabled="!criteriaText.trim()"
          data-testid="ai-transfer-save-btn"
          @click="save"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import agentBuilder from '@/services/api/resources/settings/agentBuilder';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  initialCriteria: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const criteriaText = ref('');
const isSaving = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      criteriaText.value = props.initialCriteria;
    }
  },
);

const close = () => {
  isOpen.value = false;
};

const save = async () => {
  if (!criteriaText.value.trim()) return;

  isSaving.value = true;
  try {
    await agentBuilder.updateAiTransferConfig({
      enabled: true,
      criteria: criteriaText.value.trim(),
    });

    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.changes_saved'),
        type: 'success',
      },
      seconds: 5,
    });

    emit('saved', criteriaText.value.trim());
    close();
  } catch (error) {
    console.error('Failed to save AI transfer config:', error);
    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.changes_not_saved'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isSaving.value = false;
  }
};

defineExpose({ criteriaText, isSaving, isOpen, save });
</script>

<style lang="scss" scoped>
.ai-transfer-modal__body {
  padding: $unnnic-space-5;
}
</style>
