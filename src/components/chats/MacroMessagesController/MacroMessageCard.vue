<template>
  <section class="macro-message" @click="$emit('select')" @keypress.enter="$emit('select')">
    <header>
      <span>{{ title }}</span>
      <unnnic-icon-svg icon="navigation-menu-vertical-1" size="sm" class="close-icon" />
    </header>

    <p>{{ message }}</p>
  </section>
</template>

<script>
export default {
  name: 'MacroMessageCard',

  props: {
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.macro-message {
  padding: 0.5rem 1rem;
  border: solid 1px $unnnic-color-neutral-dark;
  border-radius: $unnnic-border-radius-md;
  cursor: pointer;

  header {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;

    span {
      font-size: 0.875rem;
      line-height: 1.375rem;
      color: $unnnic-color-neutral-dark;
    }
  }

  p {
    font-size: 0.75rem;
    line-height: 1.25rem;
    color: $unnnic-color-neutral-dark;
  }
}
</style>
