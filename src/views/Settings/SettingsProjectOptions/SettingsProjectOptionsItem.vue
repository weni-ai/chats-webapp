<template>
  <section class="project-options__item">
    <UnnnicSwitch
      :modelValue="props.modelValue"
      :textRight="props.name"
      :disabled="props.disabled"
      :helper="props.hint"
      @update:model-value="emit('update:model-value', $event)"
    />
    <UnnnicToolTip
      v-if="props.tooltip"
      enabled
      :text="props.tooltip"
      side="right"
      maxWidth="20rem"
    >
      <UnnnicIcon
        icon="info"
        scheme="fg-base"
        filled
        size="sm"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  name: string;
  tooltip?: string;
  disabled?: boolean;
  hint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  tooltip: '',
  hint: '',
});

const emit = defineEmits<{
  'update:model-value': [boolean];
}>();
</script>

<style lang="scss" scoped>
.project-options__item {
  display: flex;
  gap: $unnnic-space-1;
  align-items: center;

  .unnnic-tooltip {
    display: flex;
  }
}
</style>
