<template>
  <UnnnicModalDialog
    :modelValue="modelValue"
    class="modal-offline-agent"
    showCloseIcon
    :title="$t('offline_agent_modal.title')"
    size="md"
    type="warning"
    data-testid="offline-agent-modal"
    @update:model-value="closeModal()"
  >
    <section class="modal-offline-agent__content">
      <p class="modal-offline-agent__content__description">
        {{ $t('offline_agent_modal.description', { username: 'John Doe' }) }}
      </p>
    </section>
  </UnnnicModalDialog>
</template>

<script setup>
import { ref } from 'vue';

const modelValue = ref(false);

const closeModal = () => {
  modelValue.value = false;
};
</script>

<style lang="scss" scoped>
.modal-offline-agent {
  &__content {
    display: flex;
    flex-direction: column;

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
