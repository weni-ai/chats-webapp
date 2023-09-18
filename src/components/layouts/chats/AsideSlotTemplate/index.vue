<template>
  <aside class="aside-slot-template">
    <!-- <header class="aside-slot-template__header">
      <span class="aside-slot-template__title">
        <span v-if="icon">
          <unnnic-icon-svg :icon="icon" size="ant" scheme="neutral-darkest" />
        </span>
        <span>
          {{ title }}
        </span>
      </span>

      <span
        v-if="!noIconAction"
        @click="$emit('action')"
        @keypress.enter="$emit('action')"
        class="clickable"
      >
        <unnnic-icon-svg :icon="iconAction" size="sm" scheme="neutral-dark" />
      </span>
    </header> -->

    <unnnic-chats-header
      :title="title"
      :avatarIcon="icon"
      :close="() => $emit('close')"
      :back="back"
    />

    <section :class="['aside-slot-template__sections']">
      <slot />
    </section>
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
    iconAction: {
      type: String,
      default: 'close-1',
    },
    noIconAction: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    back: {
      type: Function,
      default: undefined,
      required: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.aside-slot-template {
  display: flex;
  flex-direction: column;
  height: inherit;

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
