<template>
  <UnnnicDialog
    class="modal-confirm-destroy"
    :open="open"
  >
    <UnnnicDialogContent>
      <section class="modal-confirm-destroy__content">
        <UnnnicIcon
          icon="alert-circle-1"
          size="xl"
          scheme="feedback-red"
        />
        <p class="modal-confirm-destroy__content__title">
          {{ title }}
        </p>
        <p class="modal-confirm-destroy__content__description">
          {{ description }}
        </p>
        <UnnnicInput
          v-model="inputConfirmText"
          class="modal-confirm-destroy__content__input"
          :placeholder="confirmText"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          text="Cancel"
          type="tertiary"
          :disabled="isLoading"
          @click="emit('cancel')"
        />
        <UnnnicButton
          text="Confirm"
          type="warning"
          :disabled="!isValid"
          :loading="isLoading"
          @click="emit('confirm')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const inputConfirmText = ref('');

const isValid = computed(() => {
  return inputConfirmText.value === props.confirmText;
});
</script>

<style lang="scss" scoped>
.modal-confirm-destroy {
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;

    &__title {
      font: $unnnic-font-display-2;
      color: $unnnic-color-gray-800;
    }

    &__description {
      font: $unnnic-font-display-4;
      color: $unnnic-color-fg-base;
    }

    &__input {
      width: 100%;
    }
  }
}
</style>
