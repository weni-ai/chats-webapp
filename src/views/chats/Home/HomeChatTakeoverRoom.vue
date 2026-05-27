<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader type="attention">
        <UnnnicDialogTitle>
          {{ title }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="home-chat-takeover-room__content">
        <p class="home-chat-takeover-room__description">
          {{ description }}
        </p>
      </section>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  title: string;
  description: string;
}

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const props = defineProps<Props>();

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    if (!value) {
      emit('close');
    }
    emit('update:modelValue', value);
  },
});
</script>

<style lang="scss" scoped>
.home-chat-takeover-room {
  &__content {
    display: flex;
    padding: $unnnic-space-6;
  }
}
</style>
