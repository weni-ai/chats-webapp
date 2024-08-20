<template>
  <section class="project-options__config">
    <UnnnicSwitch
      :modelValue="modelValue"
      :textRight="name"
      @update:model-value="$emit('update:model-value', $event)"
    />
    <UnnnicToolTip
      v-if="tooltip"
      enabled
      :text="tooltip"
      side="right"
      maxWidth="20rem"
    >
      <UnnnicIcon
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
<style lang=""></style>
