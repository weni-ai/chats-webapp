<template>
  <div class="order">
    <p
      v-if="label"
      class="label"
    >
      {{ label }}:
    </p>

    <section class="ordinators">
      <UnnnicRadio
        v-for="(ordinator, index) in ordinators"
        :key="index"
        size="md"
        :value="ordinator"
        :modelValue="modelValue"
        @update:model-value="$emit('update:model-value', $event)"
      >
        {{ $t(`order_by.option.${ordinator}`) }}
      </UnnnicRadio>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, default: '' },
    ordinators: {
      type: Array,
      default: () => ['alphabetical', 'newer', 'older'],
    },
    modelValue: { type: String, required: true },
  },
  emits: ['update:model-value'],
};
</script>

<style lang="scss" scoped>
.order {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-family: $unnnic-font-family-secondary;
  font-weight: $unnnic-font-weight-regular;
  color: $unnnic-color-neutral-darkest;
  font-size: $unnnic-font-size-body-gt;
  line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  column-gap: $unnnic-spacing-sm;
  row-gap: $unnnic-spacing-stack-nano;

  .ordinators {
    display: flex;
    align-items: center;
    column-gap: $unnnic-spacing-inline-xs;
  }
}
</style>
