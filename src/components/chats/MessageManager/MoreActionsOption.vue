<template>
  <section>
    <UnnnicDropdownItem
      class="more-actions-option"
      @click="action"
      @keypress.enter="action"
    >
      <UnnnicIconSvg
        :icon="icon"
        next
        size="sm"
      />
      <p>{{ title }}</p>
    </UnnnicDropdownItem>
  </section>
</template>

<script>
export default {
  name: 'MoreAtionsOption',

  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    action: { type: Function, required: true },
    inputType: {
      type: String,
      validator(value) {
        return ['image', 'doc'].includes(value);
      },
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
a.more-actions-option {
  &::before {
    display: none;
  }

  padding: $unnnic-spacing-stack-sm 0;

  display: flex;
  gap: $unnnic-spacing-inline-xs;

  width: max-content;
}
</style>
