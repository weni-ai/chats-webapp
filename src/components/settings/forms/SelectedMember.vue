<template>
  <section class="selected-member">
    <section class="selected-member__role">
      <p class="selected-member__role-name">
        {{ roleName }}
      </p>
    </section>
    <div class="selected-member__info">
      <span class="selected-member__name">{{ name }}</span>
      <span class="selected-member__email">{{ email }}</span>
    </div>
    <div
      class="selected-member__remove-button"
      @click="remove"
      @keypress.enter="remove"
    >
      <UnnnicIcon
        icon="close"
        scheme="neutral-darkest"
        size="sm"
        data-testid="remove-member-button"
        clickable
      />
    </div>
  </section>
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
  },

  emits: ['remove'],

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
  gap: $unnnic-spacing-sm;
  padding-top: $unnnic-spacing-nano;

  text-align: start;

  &__role {
    display: flex;
    padding: $unnnic-spacing-nano $unnnic-spacing-xs;
    justify-content: center;
    align-items: center;
    background-color: $unnnic-color-neutral-lightest;
    gap: 10px; // not exists in unnnic tokens
    border-radius: $unnnic-radius-2;

    &-name {
      color: $unnnic-color-neutral-darkest;
      font-family: $unnnic-font-family-secondary;
      font-weight: $unnnic-font-weight-bold;
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }

  &__info {
    flex: 1 1;
    display: flex;
    gap: $unnnic-spacing-sm;
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
