<template>
  <span
    class="user-avatar"
    :class="{
      active,
      off,
      clickable,
      'neutral-background': disabled,
      [`user-avatar--${size}`]: true,
    }"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <unnnic-icon-svg v-if="username === 'Agente'" icon="single-neutral-actions-1" size="sm" />
    <span v-else>
      {{ getUsernameFirstCharacter }}
    </span>
  </span>
</template>

<script>
export default {
  name: 'UserAvatar',

  props: {
    active: {
      type: Boolean,
      default: false,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    off: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) =>
        ['nano', 'xs', 'sm', 'ant', 'md', 'lg', 'xl', '2xl'].indexOf(value) !== -1,
    },
    username: {
      type: String,
      required: true,
    },
  },

  computed: {
    getUsernameFirstCharacter() {
      return this.username ? this.username.charAt(0).toUpperCase() : '';
    },
  },
};
</script>

<style lang="scss" scoped>
$avatar-sizes: '2xl' 3rem, 'xl' $unnnic-icon-size-xl, 'lg' $unnnic-icon-size-lg,
  'md' $unnnic-icon-size-md, 'ant' $unnnic-icon-size-ant, 'sm' $unnnic-icon-size-sm,
  'xs' $unnnic-icon-size-xs;

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $unnnic-border-radius-sm;

  background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
  color: $unnnic-color-brand-weni-dark;

  &.active {
    background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-light);
  }

  &.neutral-background {
    background: $unnnic-color-neutral-clean;
  }

  &.off {
    color: $unnnic-color-neutral-clean;
  }

  @each $name, $size in $avatar-sizes {
    &--#{$name} {
      width: $size;
      height: $size;
      font-size: min(calc($size / 2), 1rem);
    }
  }
}
</style>
