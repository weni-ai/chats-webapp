<template>
  <div :class="{ 'chat-feedback__container': true, divisor }">
    <UnnnicTag
      :text="treatedFeedback"
      :scheme="scheme"
      type="default"
      size="small"
      @click="handleClick"
    />
  </div>
</template>

<script>
export default {
  name: 'ChatFeedback',
  props: {
    feedback: {
      type: String,
      default: '',
      required: true,
    },
    scheme: {
      type: String,
      default: 'blue',
      validator(value) {
        return ['blue', 'purple', 'red', 'green', 'yellow', 'gray'].includes(
          value,
        );
      },
    },
    divisor: {
      type: Boolean,
      default: false,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['click'],

  computed: {
    treatedFeedback() {
      const trimFeedback = this.feedback.trim();
      return trimFeedback.charAt(0).toUpperCase() + trimFeedback.slice(1);
    },
  },
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit('click');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-feedback__container {
  margin-top: $unnnic-spacing-md;

  overflow: hidden;

  display: flex;
  justify-content: center;

  &.clickable {
    cursor: pointer;
  }

  &.divisor {
    padding-top: $unnnic-spacing-md;
    border-top: $unnnic-border-width-thinner solid $unnnic-color-neutral-soft;
  }
}
</style>
