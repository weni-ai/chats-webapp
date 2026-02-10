<template>
  <UnnnicDialog
    v-model:open="open"
    class="confirm-csat-modal"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader type="attention">
        <UnnnicDialogTitle>
          {{ $t('attention') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="confirm-csat-modal__content">
        <p>
          {{ $t('sector.additional_options.csat.confirm_modal.content_1') }}
        </p>
        <p>
          {{ $t('sector.additional_options.csat.confirm_modal.content_2') }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          text="Close"
          type="tertiary"
          @click="emit('cancel')"
        />
        <UnnnicButton
          text="Confirm"
          type="attention"
          @click="emit('confirm')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(['confirm', 'cancel', 'update:modelValue']);

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
</script>

<style lang="scss" scoped>
.confirm-csat-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
}
</style>
