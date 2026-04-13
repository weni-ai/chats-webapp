<template>
  <UnnnicToolTip
    :enabled="hideCount"
    :text="$t('chats.waiting_tooltip')"
  >
    <section
      class="tab-chip"
      @click="$emit('click')"
    >
      <UnnnicChip
        class="tab-chip__chip"
        isClickable
        :isSelected="active"
        type="single"
        :text="label"
        :count="hideCount ? 0 : count"
      >
        <template
          v-if="hideCount && showDot"
          #right
        >
          <span class="tab-chip__dot--without-count" />
        </template>
      </UnnnicChip>
      <span
        v-if="!hideCount && showDot"
        class="tab-chip__dot"
      />
    </section>
  </UnnnicToolTip>
</template>

<script>
export default {
  name: 'TabChip',
  props: {
    hideCount: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    showDot: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
};
</script>

<style scoped lang="scss">
.tab-chip {
  display: flex;
  position: relative;
  &__dot {
    position: absolute;
    width: $unnnic-space-2;
    height: $unnnic-space-2;
    background-color: $unnnic-color-fg-accent;
    border-radius: 50%;
    display: inline-block;
    margin-left: 82%;
    margin-top: 5%;
    &--without-count {
      width: $unnnic-space-2;
      height: $unnnic-space-2;
      background-color: $unnnic-color-fg-accent;
      border-radius: 50%;
      display: inline-block;
    }
  }
}
</style>
