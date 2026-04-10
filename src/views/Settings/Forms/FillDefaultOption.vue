<template>
  <section class="fill-default-option">
    <UnnnicRadio
      :modelValue="props.modelValue"
      :value="0"
      data-testid="disable-default-queue-config"
      @update:model-value="updateDefaultSectorQueueValue"
    >
      {{ props.customizedOptionText }}
    </UnnnicRadio>
    <UnnnicRadio
      :modelValue="props.modelValue"
      :value="1"
      data-testid="enable-default-queue-config"
      @update:model-value="updateDefaultSectorQueueValue"
    >
      {{ props.defaultOptionText }}
    </UnnnicRadio>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'FillDefaultOption',
});

interface Props {
  modelValue: boolean;
  customizedOptionText: string;
  defaultOptionText: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const updateDefaultSectorQueueValue = (value: boolean) => {
  emit('update:modelValue', value);
};
</script>

<style lang="scss" scoped>
.fill-default-option {
  display: flex;
  gap: $unnnic-space-6;
}
</style>
