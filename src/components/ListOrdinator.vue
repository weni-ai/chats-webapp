<template>
  <UnnnicRadioGroup
    :modelValue="props.modelValue"
    :label="props.label"
    @update:model-value="emit('update:model-value', $event)"
  >
    <UnnnicRadio
      v-for="ordinator in props.ordinators"
      :key="ordinator"
      :value="ordinator"
    >
      {{ $t(`order_by.option.${ordinator}`) }}
    </UnnnicRadio>
  </UnnnicRadioGroup>
</template>

<script setup lang="ts">
interface Props {
  label?: string;
  ordinators?: string[];
  modelValue: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  ordinators: () => ['alphabetical', 'newer', 'older'],
});

const emit = defineEmits<{
  'update:model-value': [string];
}>();
</script>
