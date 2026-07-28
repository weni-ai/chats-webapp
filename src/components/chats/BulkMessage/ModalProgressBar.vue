<template>
  <UnnnicDialog v-model:open="isOpen">
    <UnnnicDialogContent
      class="modal-progress-bar__content"
      size="large"
      @pointer-down-outside="preventDismiss"
      @escape-key-down="preventDismiss"
    >
      <UnnnicProgressBar
        class="modal-progress-bar__progress"
        data-testid="modal-progress-bar"
        :modelValue="modelValue"
        :type="type || 'primary'"
        :title="title || ''"
        :subtitle="subtitle || ''"
      />
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'ModalProgressBar',
});

defineProps<{
  modelValue: number;
  title?: string;
  subtitle?: string;
  type?: 'primary' | 'secondary';
}>();

const isOpen = ref(true);

function preventDismiss(event: Event) {
  event.preventDefault();
}
</script>

<style lang="scss">
.modal-progress-bar__progress {
  background-color: $unnnic-color-bg-base !important; // TODO: check deep
}
</style>
