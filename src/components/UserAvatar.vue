<template>
  <span @click="$emit('click')" @keypress.enter="$emit('click')">
    <unnnic-avatar-icon
      icon="single-neutral-actions-1"
      :schema="'aux-blue'"
      :enabled="false"
      :size="size"
      class="user-avatar"
      :class="{ active }"
      v-bind="$attrs"
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
}
</style>
