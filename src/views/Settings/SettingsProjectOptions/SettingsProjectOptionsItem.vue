<template>
  <section class="project-options__item">
    <UnnnicSwitch
      data-testid="settings-project-option-switch"
      :modelValue="modelValue"
      :textRight="name"
      @update:model-value="$emit('update:model-value', $event)"
    />
    <UnnnicToolTip
      v-if="tooltip"
      data-testid="settings-project-option-tooltip"
      enabled
      :text="tooltip"
      side="right"
      maxWidth="20rem"
    >
      <UnnnicIcon
        data-testid="settings-project-option-tooltip-icon"
        icon="info"
        scheme="neutral-soft"
        filled
        size="sm"
      />
    </UnnnicToolTip>
  </section>
</template>

<script>
export default {
  name: 'SettingsProjectOptionsItem',

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
    tooltip: {
      type: String,
      default: '',
    },
  },

  emits: ['update:model-value'],
};
</script>

<style lang="scss" scoped>
.project-options__item {
  display: flex;
  gap: $unnnic-spacing-nano;
  align-items: center;

  .unnnic-tooltip {
    display: flex;
  }
}
</style>
