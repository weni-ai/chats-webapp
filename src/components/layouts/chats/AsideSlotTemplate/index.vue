<template>
  <aside class="aside-slot-template">
    <UnnnicChatsHeader
      :title="title"
      :subtitle="subtitle"
      :avatarIcon="icon"
      :avatarName="avatarName"
      :close="close"
      :back="back"
      :sectionIconScheme="iconScheme || 'aux-purple'"
    />

    <section :class="['aside-slot-template__sections']">
      <slot />
    </section>

    <slot name="modals" />
  </aside>
</template>

<script>
export default {
  name: 'AsideSlotTemplate',
  props: {
    icon: {
      type: String,
      default: '',
    },
    iconScheme: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: false,
    },
    avatarName: {
      type: String,
      required: false,
    },
    back: {
      type: Function,
      default: undefined,
      required: false,
    },
    close: {
      type: Function,
      default: undefined,
      required: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.aside-slot-template {
  position: relative;

  display: flex;
  flex-direction: column;
  height: 100%;

  overflow: hidden;

  &__title {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-nano;

    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-bold;
  }

  &__sections {
    flex: 1 1;
    min-height: 0;
    display: grid;
  }
}
</style>
