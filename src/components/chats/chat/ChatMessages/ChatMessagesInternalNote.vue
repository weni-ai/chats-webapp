<template>
  <section class="chat-messages__internal-note-container">
    <div class="chat-messages__internal-note">
      <p
        v-if="showAgentName"
        class="chat-messages__internal-note-agent-name"
      >
        Eduardo Medeiros
      </p>
      <p class="chat-messages__internal-note-text">
        {{ message.text }}
      </p>
    </div>
    <UnnnicIcon
      icon="delete"
      size="ant"
      scheme="aux-red-500"
      clickable
      @click="() => {}"
    />
  </section>
</template>

<script>
export default {
  name: 'ChatMessagesInternalNote',
  props: {
    showAgentName: {
      type: Boolean,
      default: false,
    },
    message: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-messages__internal-note {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: $unnnic-color-aux-baby-yellow;
  padding: $unnnic-spacing-xs $unnnic-spacing-ant;
  border-radius: $unnnic-border-radius-md;
  width: 100%;

  &-container {
    margin-top: $unnnic-spacing-ant;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-text {
    color: $unnnic-color-neutral-cloudy;
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-medium;
  }

  &-agent-name {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-darkest;
  }
}
</style>
