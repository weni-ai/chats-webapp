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
        :modelValue="modelValue"
        :type="type"
        :title="title"
        :subtitle="subtitle"
        :canClose="canClose"
        @close="handleClose"
      />
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

defineOptions({
  name: 'ModalProgressBar',
});

const props = withDefaults(
  defineProps<{
    modelValue: number;
    title?: string;
    subtitle?: string;
    type?: 'primary' | 'secondary';
    canClose?: boolean;
  }>(),
  {
    title: '',
    subtitle: '',
    type: 'primary',
    canClose: false,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const isOpen = ref(true);

watch(isOpen, (value) => {
  if (!value) {
    emit('close');
  }
});

function preventDismiss(event: Event) {
  if (!props.canClose) {
    event.preventDefault();
  }
}

function handleClose() {
  isOpen.value = false;
}
</script>

<style lang="scss">
.modal-progress-bar__progress {
  background-color: $unnnic-color-bg-base !important; // TODO: check deep
}
</style>
