<template>
  <unnnic-dropdown-item class="more-actions-option" @click="action" @keypress.enter="action">
    <div class="title">
      <unnnic-icon-svg :icon="icon" size="sm" />
      <span> {{ title }} </span>
    </div>
  </unnnic-dropdown-item>
</template>

<script>
export default {
  name: 'MoreAtionsOption',

  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    action: { type: Function, required: true },
  },
};
</script>

<style lang="scss" scoped>
a.more-actions-option {
  &::before {
    margin: 0;
  }

  .title {
    padding: $unnnic-spacing-stack-sm 0;
    display: flex;
    gap: $unnnic-spacing-inline-xs;
    width: max-content;
  }
}
</style>
