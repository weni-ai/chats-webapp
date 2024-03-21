<template>
  <div class="selected-member">
    <div class="selected-member__avatar">
      <img
        :src="avatarUrl || '/avatar/default.svg'"
        :alt="`${name}'s avatar`"
      />
    </div>
    <div class="selected-member__info">
      <span class="selected-member__name">{{ name }}</span>
      <span class="selected-member__email">{{ email }}</span>
    </div>

    <div
      v-if="!!roleName"
      class="selected-member__role"
    >
      <UnnnicButton
        disabled
        :text="roleName"
        size="small"
      />
    </div>

    <div
      class="selected-member__remove-button"
      @click="remove"
      @keypress.enter="remove"
    >
      <UnnnicIcon
        icon="cancel"
        scheme="neutral-darkest"
        size="sm"
        clickable
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectedMember',

  props: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    roleName: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },

  methods: {
    remove() {
      this.$emit('remove');
    },
  },
};
</script>

<style lang="scss" scoped>
.selected-member {
  display: flex;
  align-items: center;
  gap: $unnnic-spacing-stack-xs;

  text-align: start;

  &__avatar {
    border-radius: 50%;

    overflow: hidden;

    width: $unnnic-avatar-size-sm;
    height: $unnnic-avatar-size-sm;

    & > img {
      width: 100%;
      height: 100%;

      object-fit: cover;
    }
  }

  &__info {
    flex: 1 1;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
  }

  &__name {
    line-height: 1.375rem;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-darkest;
  }

  &__email {
    line-height: 1.375rem;
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
  }

  &__remove-button {
    display: flex;
  }
}
</style>
