<template>
  <div :class="{ 'chat-feedback__container': true, divisor }">
    <!-- eslint-disable vue/no-v-html -->
    <strong
      :class="[
        'chat-feedback',
        scheme ? `chat-feedback--${scheme}` : '',
        clickable ? 'clickable' : '',
      ]"
      data-testid="chat-feedback"
      @click="handleClick"
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
        return [
          'blue',
          'purple',
          'red',
          'green',
          'yellow',
          'yellow-400',
          'gray',
        ].includes(value);
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
$scheme-colors:
  'blue' $unnnic-color-bg-blue-plain,
  'purple' $unnnic-color-bg-purple-plain,
  'green' $unnnic-color-bg-green-plain,
  'yellow' $unnnic-color-bg-yellow-plain,
  'yellow-400' $unnnic-color-bg-yellow-strong,
  'red' $unnnic-color-bg-red-plain,
  'gray' $unnnic-color-bg-base-soft;

.chat-feedback__container {
  margin-top: $unnnic-spacing-md;

  overflow: hidden;

  display: flex;

  &.clickable {
    cursor: pointer;
  }

  &.divisor {
    padding-top: $unnnic-spacing-md;
    border-top: 1px solid $unnnic-color-border-soft;
  }

  .chat-feedback {
    margin: 0 auto;
    border-radius: $unnnic-border-radius-pill;

    overflow: hidden;

    padding: $unnnic-space-05 $unnnic-space-3;

    font: $unnnic-font-caption-1;
    color: $unnnic-color-fg-emphasized;
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
