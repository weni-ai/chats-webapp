<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="ai-transfer-disable-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader type="attention">
        <UnnnicDialogTitle>
          {{ $t('attention') }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose @click="close" />
      </UnnnicDialogHeader>

      <section class="ai-transfer-disable-modal__body">
        <p
          class="ai-transfer-disable-modal__text"
          data-testid="ai-transfer-disable-description"
        >
          {{
            $t(
              'config_chats.project_configs.ai_transfer.disable_modal.description',
            )
          }}
        </p>
        <p
          class="ai-transfer-disable-modal__text"
          data-testid="ai-transfer-disable-confirmation"
        >
          {{
            $t(
              'config_chats.project_configs.ai_transfer.disable_modal.confirmation',
            )
          }}
        </p>
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          data-testid="ai-transfer-disable-cancel-btn"
          @click="close"
        />
        <UnnnicButton
          type="attention"
          :text="$t('continue')"
          data-testid="ai-transfer-disable-confirm-btn"
          @click="confirm"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

const isOpen = computed<boolean>({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const close = (): void => {
  isOpen.value = false;
};

const confirm = (): void => {
  emit('confirm');
  close();
};

defineExpose({ isOpen, close, confirm });
</script>

<style lang="scss" scoped>
.ai-transfer-disable-modal {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-6;
  }

  &__text {
    color: $unnnic-color-fg-base;
    font: $unnnic-text-body;
  }
}
</style>
