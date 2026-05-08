<template>
  <UnnnicDialog
    v-model:open="open"
    data-testid="discart-changes-modal"
  >
    <UnnnicDialogContent size="small">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>{{ props.title }}</UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="discart-changes-modal__content">
        <p class="discart-changes-modal__text">{{ props.text }}</p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('back')"
          type="tertiary"
          @click="$emit('cancel')"
        />
        <UnnnicButton
          :text="$t('discart')"
          type="primary"
          @click="$emit('confirm')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'DiscartChangesModal',
});

interface Props {
  modelValue: boolean;
  title?: string;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  text: '',
});
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [void];
  cancel: [void];
}>();

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
.discart-changes-modal {
  &__content {
    padding: $unnnic-space-6;
  }
}
</style>
