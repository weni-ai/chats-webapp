<template>
  <div :class="{ 'chat-feedback__container': true, divisor }">
    <!-- eslint-disable vue/no-v-html -->
    <strong
      :class="['chat-feedback', scheme ? `chat-feedback--${scheme}` : '']"
      data-testid="chat-feedback"
      v-html="treatedFeedback"
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
  },

  computed: {
    treatedFeedback() {
      const trimFeedback = this.feedback.trim();
      return trimFeedback.charAt(0).toUpperCase() + trimFeedback.slice(1);
    },
  },
};
</script>

<style lang="scss" scoped>
$scheme-colors:
  'blue' $unnnic-color-aux-blue-100,
  'purple' $unnnic-color-aux-purple-100,
  'green' $unnnic-color-aux-green-100,
  'yellow' $unnnic-color-aux-yellow-100,
  'red' $unnnic-color-aux-red-100,
  'gray' $unnnic-color-neutral-soft;

.chat-feedback__container {
  margin-top: $unnnic-spacing-md;

  overflow: hidden;

  display: flex;

  &.divisor {
    padding-top: $unnnic-spacing-md;
    border-top: $unnnic-border-width-thinner solid $unnnic-color-neutral-soft;
  }

  .chat-feedback {
    margin: 0 auto;
    border-radius: $unnnic-border-radius-lg;

    overflow: hidden;

    padding: $unnnic-spacing-nano $unnnic-spacing-sm;

    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-black;
    font-weight: $unnnic-font-weight-regular;
    white-space: nowrap;
    text-overflow: ellipsis;

    @each $name, $color in $scheme-colors {
      &--#{$name} {
        background-color: $color;
      }
    }
  }
}
</style>
