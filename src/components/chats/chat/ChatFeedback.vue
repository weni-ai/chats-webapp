<template>
  <div class="chat-feedback__container">
    <strong :class="['chat-feedback', scheme ? `chat-feedback--${scheme}` : '']">
      {{ feedback }}
    </strong>
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
        return ['blue', 'purple', 'red', 'green', 'yellow'].includes(value);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
$scheme-colors: 'blue' $unnnic-color-aux-blue-100, 'purple' $unnnic-color-aux-purple-100,
  'green' $unnnic-color-aux-green-100, 'yellow' $unnnic-color-aux-yellow-100,
  'red' $unnnic-color-aux-red-100;

.chat-feedback__container {
  margin-top: $unnnic-spacing-md;

  display: flex;

  .chat-feedback {
    margin: 0 auto;
    border-radius: $unnnic-border-radius-lg;

    padding: $unnnic-spacing-nano $unnnic-spacing-sm;

    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-black;
    font-weight: $unnnic-font-weight-regular;

    @each $name, $color in $scheme-colors {
      &--#{$name} {
        background-color: $color;
      }
    }
  }
}
</style>
