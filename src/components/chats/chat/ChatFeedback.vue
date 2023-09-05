<template>
  <div class="chat-feedback__container">
    <strong class="chat-feedback">
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
  },
};
</script>

<style lang="scss" scoped>
.chat-feedback {
  margin: 0 auto;
  border-radius: $unnnic-border-radius-lg;

  padding: $unnnic-spacing-nano $unnnic-spacing-xs;

  background-color: $unnnic-color-aux-blue-100;

  font-size: $unnnic-font-size-body-md;
  color: $unnnic-color-neutral-black;
  font-weight: $unnnic-font-weight-regular;

  &__container {
    display: flex;
  }
}
</style>
