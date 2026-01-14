<template>
  <section class="contact-header">
    <section
      :class="['contact-header__container', { clickable }]"
      @click="clickable ? emit('click') : null"
    >
      <section class="contact-header__avatar">
        <span>{{ avatarCharacter }}</span>
      </section>
      <section class="contact-header__name">
        <p>
          {{ contactName || `[${$t('unnamed_contact')}]` }}
        </p>
      </section>
    </section>
    <slot
      v-if="hasActionsSlot"
      name="actions"
    />
  </section>
</template>

<script>
export default {
  name: 'ContactHeader',
  props: {
    contactName: {
      type: String,
      default: '',
    },
    clickable: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],

  computed: {
    hasActionsSlot() {
      return !!this.$slots.actions?.();
    },
    avatarCharacter() {
      const cleanContactName = this.contactName.replace(/[^a-zA-Z0-9]+/g, '');
      const firstCodePoint = (cleanContactName || this.contactName).codePointAt(
        0,
      );
      if (firstCodePoint) {
        return String.fromCodePoint(firstCodePoint);
      }
      return '-';
    },
  },
};
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}
.contact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $unnnic-space-2 $unnnic-space-4;
  width: 100%;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background-color: $unnnic-color-gray-200;

    font: $unnnic-font-action;
    color: $unnnic-color-gray-900;
    border-radius: $unnnic-radius-full;
  }

  &__name {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }

  &__container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
  }
}
</style>
