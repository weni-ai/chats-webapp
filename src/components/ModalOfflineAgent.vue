<template>
  <UnnnicDialog
    v-model:open="open"
    data-testid="offline-agent-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader type="warning">
        <UnnnicDialogTitle data-testid="modal-title">
          {{ $t('offline_agent_modal.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section
        class="modal-offline-agent__content"
        data-testid="modal-content"
      >
        <p
          class="modal-offline-agent__content__description"
          data-testid="modal-description"
        >
          {{ $t('offline_agent_modal.description', { username }) }}
        </p>
      </section>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    default: '-',
  },
});

const emit = defineEmits(['update:modelValue']);

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
.modal-offline-agent {
  &__content {
    display: flex;
    flex-direction: column;
    padding: $unnnic-space-6;

    &__description {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }
}
</style>
