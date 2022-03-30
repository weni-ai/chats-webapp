<template>
  <span @click="$emit('click')" @keypress.enter="$emit('click')">
    <unnnic-avatar-icon
      icon="single-neutral-actions-1"
      :enabled="false"
      :size="size"
      class="user-avatar"
      :class="{ active, 'neutral-background': disabled }"
    />
  </span>
</template>

<script>
import { unnnicAvatarIcon } from '@weni/unnnic-system';

export default {
  name: 'UserAvatar',

  props: {
    active: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'sm',
    },
  },

  components: {
    unnnicAvatarIcon,
  },
};
</script>

<style lang="scss" scoped>
.user-avatar {
  background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light) !important;

  &.active {
    background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-light) !important;
  }

  &.neutral-background {
    background: $unnnic-color-neutral-clean !important;
  }
}
</style>
